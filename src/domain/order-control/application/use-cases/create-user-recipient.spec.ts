import { describe, it, expect, beforeEach } from 'vitest'
import { CreateRecipientUseCase } from './create-user-recipient'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeUser } from 'test/factories/make-users'
import { ConflictException } from '@nestjs/common'
import { HashGenerator } from '@/domain/order-control/application/cryptography/hash-generator'

class MockHashGenerator implements HashGenerator {
  async hash(plain: string): Promise<string> {
    return `hashed-${plain}`
  }
}

let inMemoryUsersRepository: InMemoryUsersRepository
let mockHashGenerator: MockHashGenerator
let sut: CreateRecipientUseCase

describe('Create Recipient Use Case', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    mockHashGenerator = new MockHashGenerator()
    sut = new CreateRecipientUseCase(inMemoryUsersRepository, mockHashGenerator)
  })

  it('should create a recipient user', async () => {
    const result = await sut.execute({
      name: 'Mariana Oliveira',
      cpf: '987.654.321-00',
      password: 'password123',
      email: 'mariana.oliveira@example.com',
      phone: '(41) 99988-7766',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toMatchObject({
      user: expect.objectContaining({
        role: 'recipient',
        status: 'active',
        name: 'Mariana Oliveira',
        cpf: '987.654.321-00',
        email: 'mariana.oliveira@example.com',
        phone: '(41) 99988-7766',
        password: 'hashed-password123',
      }),
    })
    expect(inMemoryUsersRepository.items).toHaveLength(1)
    expect(inMemoryUsersRepository.items[0].role).toBe('recipient')
  })

  it('should return an error if user with same CPF already exists', async () => {
    const existingUser = makeUser(
      {
        cpf: '987.654.321-00',
        role: 'recipient',
        status: 'active',
      },
      new UniqueEntityID('user-1'),
    )

    await inMemoryUsersRepository.create(existingUser)

    const result = await sut.execute({
      name: 'Mariana Oliveira',
      cpf: '987.654.321-00',
      password: 'password123',
      email: 'mariana.oliveira@example.com',
      phone: '(41) 99988-7766',
    })

    console.log('Result for CPF conflict:', result)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ConflictException)
    expect((result.value as ConflictException).message).toBe(
      'User with same cpf address already exists.',
    )
  })

  it('should return an error if user with same email already exists', async () => {
    const existingUser = makeUser(
      {
        email: 'mariana.oliveira@example.com',
        role: 'recipient',
        status: 'active',
      },
      new UniqueEntityID('user-1'),
    )

    await inMemoryUsersRepository.create(existingUser)

    const result = await sut.execute({
      name: 'Mariana Oliveira',
      cpf: '987.654.321-00',
      password: 'password123',
      email: 'mariana.oliveira@example.com',
      phone: '(41) 99988-7766',
    })

    console.log('Result for email conflict:', result)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ConflictException)
    expect((result.value as ConflictException).message).toBe(
      'User with same email address already exists.',
    )
  })
})
