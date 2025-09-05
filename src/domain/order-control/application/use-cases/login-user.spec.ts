import { describe, it, expect, beforeEach } from 'vitest'
import { LoginUserUseCase } from './login-user'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeUser } from 'test/factories/make-users'
import { left } from '@/core/either'
import { InvalidCredentialsError } from './errors/invalid-credentials-error'
import { UserAccountIsInactiveError } from './errors/user-account-is-inactive-error'

let inMemoryUsersRepository: InMemoryUsersRepository
let sut: LoginUserUseCase

describe('Login User Use Case', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new LoginUserUseCase(inMemoryUsersRepository)
  })

  it('should login an admin user with valid credentials', async () => {
    const admin = makeUser(
      {
        cpf: '123.456.789-09',
        password: 'password123',
        role: 'admin',
        status: 'active',
        name: 'João Silva',
      },
      new UniqueEntityID('admin-1'),
    )

    await inMemoryUsersRepository.create(admin)

    const result = await sut.execute({
      cpf: '123.456.789-09',
      password: 'password123',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      userId: 'admin-1',
      role: 'admin',
    })
    expect(await inMemoryUsersRepository.findByCpf('123.456.789-09')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('admin-1'),
        cpf: '123.456.789-09',
        role: 'admin',
        status: 'active',
      }),
    )
  })

  it('should login a deliveryman user with valid credentials', async () => {
    const deliveryman = makeUser(
      {
        cpf: '987.654.321-00',
        password: 'password123',
        role: 'deliveryman',
        status: 'active',
        name: 'Ana Costa',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    await inMemoryUsersRepository.create(deliveryman)

    const result = await sut.execute({
      cpf: '987.654.321-00',
      password: 'password123',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      userId: 'deliveryman-1',
      role: 'deliveryman',
    })
    expect(await inMemoryUsersRepository.findByCpf('987.654.321-00')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('deliveryman-1'),
        cpf: '987.654.321-00',
        role: 'deliveryman',
        status: 'active',
      }),
    )
  })

  it('should return an error if CPF does not exist', async () => {
    const result = await sut.execute({
      cpf: '123.456.789-09',
      password: 'password123',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidCredentialsError)
    expect(result).toEqual(left(new InvalidCredentialsError()))
    expect(await inMemoryUsersRepository.findByCpf('123.456.789-09')).toBeNull()
  })

  it('should return an error if password is incorrect', async () => {
    const user = makeUser(
      {
        cpf: '123.456.789-09',
        password: 'password123',
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('user-1'),
    )

    await inMemoryUsersRepository.create(user)

    const result = await sut.execute({
      cpf: '123.456.789-09',
      password: 'wrong-password',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidCredentialsError)
    expect(result).toEqual(left(new InvalidCredentialsError()))
    expect(await inMemoryUsersRepository.findByCpf('123.456.789-09')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('user-1'),
        cpf: '123.456.789-09',
      }),
    )
  })

  it('should return an error if user account is inactive', async () => {
    const user = makeUser(
      {
        cpf: '123.456.789-09',
        password: 'password123',
        role: 'admin',
        status: 'inactive',
      },
      new UniqueEntityID('user-1'),
    )

    await inMemoryUsersRepository.create(user)

    const result = await sut.execute({
      cpf: '123.456.789-09',
      password: 'password123',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UserAccountIsInactiveError)
    expect(result).toEqual(left(new UserAccountIsInactiveError()))
    expect(await inMemoryUsersRepository.findByCpf('123.456.789-09')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('user-1'),
        cpf: '123.456.789-09',
        status: 'inactive',
      }),
    )
  })
})
