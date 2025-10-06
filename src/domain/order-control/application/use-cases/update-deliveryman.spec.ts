import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateDeliverymanUseCase } from './update-deliveryman'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeUser } from 'test/factories/make-users'
import { left } from '@/core/either'
import { OnlyActiveAdminsCanUpdateDeliverymenError } from './errors/only-active-admins-can-update-deliverymen-error'
import { ActiveDeliverymanNotFoundError } from './errors/active-deliveryman-not-found-error'
import { HashGenerator } from '@/domain/order-control/application/cryptography/hash-generator'

class MockHashGenerator implements HashGenerator {
  async hash(plain: string): Promise<string> {
    return `hashed-${plain}`
  }
}

let inMemoryUsersRepository: InMemoryUsersRepository
let mockHashGenerator: MockHashGenerator
let sut: UpdateDeliverymanUseCase

describe('Update Deliveryman Use Case', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    mockHashGenerator = new MockHashGenerator()
    sut = new UpdateDeliverymanUseCase(
      inMemoryUsersRepository,
      mockHashGenerator,
    )
  })

  it('should update deliveryman name if admin is valid and active', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('admin-1'),
    )

    const deliveryman = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '(11) 91234-5678',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryUsersRepository.create(deliveryman)

    const result = await sut.execute({
      adminId: 'admin-1',
      deliverymanId: 'deliveryman-1',
      name: 'João Oliveira',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      deliveryman: expect.objectContaining({
        id: new UniqueEntityID('deliveryman-1'),
        name: 'João Oliveira',
        email: 'joao@example.com',
        phone: '(11) 91234-5678',
        role: 'deliveryman',
        status: 'active',
      }),
    })
    expect(await inMemoryUsersRepository.findById('deliveryman-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('deliveryman-1'),
        name: 'João Oliveira',
        email: 'joao@example.com',
        phone: '(11) 91234-5678',
      }),
    )
  })

  it('should update all deliveryman fields if admin is valid and active', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('admin-1'),
    )

    const deliveryman = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '(11) 91234-5678',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryUsersRepository.create(deliveryman)

    const result = await sut.execute({
      adminId: 'admin-1',
      deliverymanId: 'deliveryman-1',
      name: 'Ana Costa',
      email: 'ana@example.com',
      phone: '(21) 98765-4321',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      deliveryman: expect.objectContaining({
        name: 'Ana Costa',
        email: 'ana@example.com',
        phone: '(21) 98765-4321',
        role: 'deliveryman',
        status: 'active',
      }),
    })
    expect(await inMemoryUsersRepository.findById('deliveryman-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('deliveryman-1'),
        name: 'Ana Costa',
        email: 'ana@example.com',
        phone: '(21) 98765-4321',
      }),
    )
  })

  it('should return an error if admin does not exist', async () => {
    const deliveryman = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    await inMemoryUsersRepository.create(deliveryman)

    const result = await sut.execute({
      adminId: 'admin-1',
      deliverymanId: 'deliveryman-1',
      name: 'João Oliveira',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveAdminsCanUpdateDeliverymenError,
    )
    expect(result).toEqual(
      left(new OnlyActiveAdminsCanUpdateDeliverymenError()),
    )
    expect(await inMemoryUsersRepository.findById('deliveryman-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('deliveryman-1'),
        name: expect.any(String), // Unchanged
      }),
    )
  })

  it('should return an error if admin is not an admin', async () => {
    const deliveryman1 = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    const deliveryman2 = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
      },
      new UniqueEntityID('deliveryman-2'),
    )

    await inMemoryUsersRepository.create(deliveryman1)
    await inMemoryUsersRepository.create(deliveryman2)

    const result = await sut.execute({
      adminId: 'deliveryman-1',
      deliverymanId: 'deliveryman-2',
      name: 'João Oliveira',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveAdminsCanUpdateDeliverymenError,
    )
    expect(result).toEqual(
      left(new OnlyActiveAdminsCanUpdateDeliverymenError()),
    )
    expect(await inMemoryUsersRepository.findById('deliveryman-2')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('deliveryman-2'),
        name: expect.any(String), // Unchanged
      }),
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

    const deliveryman = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryUsersRepository.create(deliveryman)

    const result = await sut.execute({
      adminId: 'admin-1',
      deliverymanId: 'deliveryman-1',
      name: 'João Oliveira',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveAdminsCanUpdateDeliverymenError,
    )
    expect(result).toEqual(
      left(new OnlyActiveAdminsCanUpdateDeliverymenError()),
    )
    expect(await inMemoryUsersRepository.findById('deliveryman-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('deliveryman-1'),
        name: expect.any(String), // Unchanged
      }),
    )
  })

  it('should return an error if deliveryman does not exist', async () => {
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
      deliverymanId: 'deliveryman-1',
      name: 'João Oliveira',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ActiveDeliverymanNotFoundError)
    expect(result).toEqual(left(new ActiveDeliverymanNotFoundError()))
    expect(await inMemoryUsersRepository.findById('deliveryman-1')).toBeNull()
  })

  it('should return an error if deliveryman is not a deliveryman', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('admin-1'),
    )

    const user = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('user-1'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryUsersRepository.create(user)

    const result = await sut.execute({
      adminId: 'admin-1',
      deliverymanId: 'user-1',
      name: 'João Oliveira',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ActiveDeliverymanNotFoundError)
    expect(result).toEqual(left(new ActiveDeliverymanNotFoundError()))
    expect(await inMemoryUsersRepository.findById('user-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('user-1'),
        role: 'admin',
        name: expect.any(String), // Unchanged
      }),
    )
  })

  it('should return an error if deliveryman is inactive', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('admin-1'),
    )

    const deliveryman = makeUser(
      {
        role: 'deliveryman',
        status: 'inactive',
        name: 'João Silva',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryUsersRepository.create(deliveryman)

    const result = await sut.execute({
      adminId: 'admin-1',
      deliverymanId: 'deliveryman-1',
      name: 'João Oliveira',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ActiveDeliverymanNotFoundError)
    expect(result).toEqual(left(new ActiveDeliverymanNotFoundError()))
    expect(await inMemoryUsersRepository.findById('deliveryman-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('deliveryman-1'),
        name: 'João Silva', // Unchanged
        status: 'inactive',
      }),
    )
  })
})
