import { describe, it, expect, beforeEach } from 'vitest'
import { MarkOrderAsPendingUseCase } from './mark-order-as-pending'
import { InMemoryOrdersRepository } from 'test/repositories/in-memory-orders-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeUser } from 'test/factories/make-users'
import { makeOrder } from 'test/factories/make-order'
import { left } from '@/core/either'
import { OnlyActiveAdminsCanMarkOrdersAsPendingError } from './errors/only-active-admins-can-mark-orders-as-pending-error'
import { OrderNotFoundError } from './errors/order-not-found-error'

let inMemoryOrdersRepository: InMemoryOrdersRepository
let inMemoryUsersRepository: InMemoryUsersRepository
let sut: MarkOrderAsPendingUseCase

describe('Mark Order As Pending Use Case', () => {
  beforeEach(() => {
    inMemoryOrdersRepository = new InMemoryOrdersRepository()
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new MarkOrderAsPendingUseCase(
      inMemoryOrdersRepository,
      inMemoryUsersRepository,
    )
  })

  it('should mark order as pending if admin is valid and active', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('admin-1'),
    )

    const order = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'Curitiba',
        state: 'PR',
        zipCode: '80010-000',
        status: 'delivered',
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      adminId: 'admin-1',
      orderId: 'order-1',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      order: expect.objectContaining({
        id: new UniqueEntityID('order-1'),
        recipientId: new UniqueEntityID('recipient-1'),
        status: 'pending',
      }),
    })
    expect(await inMemoryOrdersRepository.findById('order-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('order-1'),
        status: 'pending',
        street: 'Rua das Flores',
        number: '123',
      }),
    )
  })

  it('should return an error if admin does not exist', async () => {
    const order = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      adminId: 'admin-1',
      orderId: 'order-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveAdminsCanMarkOrdersAsPendingError,
    )
    expect(result).toEqual(
      left(new OnlyActiveAdminsCanMarkOrdersAsPendingError()),
    )
    expect(await inMemoryOrdersRepository.findById('order-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('order-1'),
        status: expect.any(String), // Unchanged
      }),
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

    const order = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryUsersRepository.create(deliveryman)
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      adminId: 'deliveryman-1',
      orderId: 'order-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveAdminsCanMarkOrdersAsPendingError,
    )
    expect(result).toEqual(
      left(new OnlyActiveAdminsCanMarkOrdersAsPendingError()),
    )
    expect(await inMemoryOrdersRepository.findById('order-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('order-1'),
        status: expect.any(String), // Unchanged
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

    const order = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      adminId: 'admin-1',
      orderId: 'order-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveAdminsCanMarkOrdersAsPendingError,
    )
    expect(result).toEqual(
      left(new OnlyActiveAdminsCanMarkOrdersAsPendingError()),
    )
    expect(await inMemoryOrdersRepository.findById('order-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('order-1'),
        status: expect.any(String), // Unchanged
      }),
    )
  })

  it('should return an error if order does not exist', async () => {
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
      orderId: 'order-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderNotFoundError)
    expect(result).toEqual(left(new OrderNotFoundError()))
    expect(await inMemoryOrdersRepository.findById('order-1')).toBeNull()
  })
})
