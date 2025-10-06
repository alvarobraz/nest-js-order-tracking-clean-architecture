import { describe, it, expect, beforeEach } from 'vitest'
import { CreateDeliverymanUseCase } from './create-deliveryman'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { User } from '@/domain/order-control/enterprise/entities/user'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeUser } from 'test/factories/make-users'
import { left } from '@/core/either'
import { OnlyActiveAdminsCanCreateDeliverymenError } from './errors/only-active-admins-can-create-deliverymen-error'
import { HashGenerator } from '@/domain/order-control/application/cryptography/hash-generator'

class MockHashGenerator implements HashGenerator {
  async hash(plain: string): Promise<string> {
    return `hashed-${plain}`
  }
}

let inMemoryUsersRepository: InMemoryUsersRepository
let mockHashGenerator: MockHashGenerator
let sut: CreateDeliverymanUseCase

describe('Create Deliveryman Use Case', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    mockHashGenerator = new MockHashGenerator()
    sut = new CreateDeliverymanUseCase(
      inMemoryUsersRepository,
      mockHashGenerator,
    )
  })

  it('should create a deliveryman if admin is valid and active', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('admin-1'),
    )

    await inMemoryUsersRepository.create(admin)

    const result = await sut.execute({
      adminId: 'admin-1',
      name: 'João Silva',
      cpf: '98765432100',
      password: 'password123',
      email: 'joao.silva@example.com',
      phone: '11912345678',
    })

    expect(result.isRight()).toBe(true)
    const value = result.value as { user: User }
    expect(value.user).toMatchObject({
      role: 'deliveryman',
      status: 'active',
      name: 'João Silva',
      password: 'hashed-password123',
      cpf: '98765432100',
      email: 'joao.silva@example.com',
      phone: '11912345678',
      createdAt: expect.any(Date),
    })

    expect(inMemoryUsersRepository.items).toHaveLength(2)
    expect(inMemoryUsersRepository.items[1].role).toBe('deliveryman')
  })

  it('should return an error if admin does not exist', async () => {
    const result = await sut.execute({
      adminId: 'admin-1',
      name: 'João Silva',
      cpf: '987.654.321-00',
      password: 'password123',
      email: 'joao.silva@example.com',
      phone: '(11) 91234-5678',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveAdminsCanCreateDeliverymenError,
    )
    expect(result).toEqual(
      left(new OnlyActiveAdminsCanCreateDeliverymenError()),
    )
  })

  it('should return an error if admin is not an admin', async () => {
    const deliveryman = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    await inMemoryUsersRepository.create(deliveryman)

    const result = await sut.execute({
      adminId: 'deliveryman-1',
      name: 'João Silva',
      cpf: '987.654.321-00',
      password: 'password123',
      email: 'joao.silva@example.com',
      phone: '(11) 91234-5678',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveAdminsCanCreateDeliverymenError,
    )
    expect(result).toEqual(
      left(new OnlyActiveAdminsCanCreateDeliverymenError()),
    )
  })

  it('should return an error if admin is inactive', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'inactive',
      },
      new UniqueEntityID('admin-1'),
    )

    await inMemoryUsersRepository.create(admin)

    const result = await sut.execute({
      adminId: 'admin-1',
      name: 'João Silva',
      cpf: '987.654.321-00',
      password: 'password123',
      email: 'joao.silva@example.com',
      phone: '(11) 91234-5678',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveAdminsCanCreateDeliverymenError,
    )
    expect(result).toEqual(
      left(new OnlyActiveAdminsCanCreateDeliverymenError()),
    )
  })
})
