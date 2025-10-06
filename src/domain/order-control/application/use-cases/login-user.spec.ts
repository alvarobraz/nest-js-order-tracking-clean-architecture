import { describe, it, expect, beforeEach } from 'vitest'
import { LoginUserUseCase } from './login-user'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeUser } from 'test/factories/make-users'
import { InvalidCredentialsError } from './errors/invalid-credentials-error'
import { UserAccountIsInactiveError } from './errors/user-account-is-inactive-error'
import { HashComparer } from '../cryptography/hash-comparer'
import { Encrypter } from '../cryptography/encrypter'
import { left } from '@/core/either'

class MockHashComparer implements HashComparer {
  async compare(plain: string, hashed: string): Promise<boolean> {
    return plain === hashed
  }
}

class MockEncrypter implements Encrypter {
  async encrypt(payload: Record<string, unknown>): Promise<string> {
    return `token-for-${payload.sub}`
  }
}

let inMemoryUsersRepository: InMemoryUsersRepository
let mockHashComparer: MockHashComparer
let mockEncrypter: MockEncrypter
let sut: LoginUserUseCase

describe('Login User Use Case', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    mockHashComparer = new MockHashComparer()
    mockEncrypter = new MockEncrypter()
    sut = new LoginUserUseCase(
      inMemoryUsersRepository,
      mockHashComparer,
      mockEncrypter,
    )
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

    const value = result.value as { accessToken: string }
    expect(value.accessToken).toBe('token-for-admin-1')

    const foundUser = await inMemoryUsersRepository.findByCpf('123.456.789-09')
    expect(foundUser).toEqual(
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

    const value = result.value as { accessToken: string }
    expect(value.accessToken).toBe('token-for-deliveryman-1')

    const foundUser = await inMemoryUsersRepository.findByCpf('987.654.321-00')
    expect(foundUser).toEqual(
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

    const foundUser = await inMemoryUsersRepository.findByCpf('123.456.789-09')
    expect(foundUser).toBeNull()
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

    const foundUser = await inMemoryUsersRepository.findByCpf('123.456.789-09')
    expect(foundUser).toEqual(
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

    const foundUser = await inMemoryUsersRepository.findByCpf('123.456.789-09')
    expect(foundUser).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('user-1'),
        cpf: '123.456.789-09',
        status: 'inactive',
      }),
    )
  })
})
