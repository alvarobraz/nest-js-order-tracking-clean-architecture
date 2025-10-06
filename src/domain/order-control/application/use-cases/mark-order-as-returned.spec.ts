import { describe, it, expect, beforeEach } from 'vitest'
import { MarkOrderAsReturnedUseCase } from './mark-order-as-returned'
import { InMemoryOrdersRepository } from 'test/repositories/in-memory-orders-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeUser } from 'test/factories/make-users'
import { makeOrder } from 'test/factories/make-order'
import { left } from '@/core/either'
import { OnlyActiveUsersCanMarkOrdersAsReturnedError } from './errors/only-active-users-can-mark-orders-as-returned-error'
import { OnlyAssignedDeliverymanOrAdminCanMarkOrderAsReturnedError } from './errors/only-assigned-deliveryman-or-admin-can-mark-order-as-returned-error'
import { OrderNotFoundError } from './errors/order-not-found-error'
import { InMemoryOrderAttachmentsRepository } from 'test/repositories/in-memory-order-attachments-repository'

let inMemoryOrdersRepository: InMemoryOrdersRepository
let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryOrderAttachmentsRepository: InMemoryOrderAttachmentsRepository
let sut: MarkOrderAsReturnedUseCase

describe('Mark Order As Returned Use Case', () => {
  beforeEach(() => {
    inMemoryOrderAttachmentsRepository =
      new InMemoryOrderAttachmentsRepository()
    inMemoryOrdersRepository = new InMemoryOrdersRepository(
      inMemoryOrderAttachmentsRepository,
    )
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new MarkOrderAsReturnedUseCase(
      inMemoryOrdersRepository,
      inMemoryUsersRepository,
    )
  })

  it('should mark order as returned if admin is valid and active', async () => {
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
      },
      new UniqueEntityID('deliveryman-1'),
    )

    const order = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
        deliverymanId: new UniqueEntityID('deliveryman-1'),
        status: 'picked_up',
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryUsersRepository.create(deliveryman)
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      userId: 'admin-1',
      orderId: 'order-1',
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.order).toEqual(
        expect.objectContaining({
          id: new UniqueEntityID('order-1'),
          status: 'returned',
        }),
      )
    }
    expect(await inMemoryOrdersRepository.findById('order-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('order-1'),
        status: 'returned',
      }),
    )
  })

  it('should mark order as returned if deliveryman is active and assigned to the order', async () => {
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
        deliverymanId: new UniqueEntityID('deliveryman-1'),
        status: 'picked_up',
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryUsersRepository.create(deliveryman)
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      userId: 'deliveryman-1',
      orderId: 'order-1',
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.order).toEqual(
        expect.objectContaining({
          id: new UniqueEntityID('order-1'),
          status: 'returned',
          deliverymanId: new UniqueEntityID('deliveryman-1'),
        }),
      )
    }
    expect(await inMemoryOrdersRepository.findById('order-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('order-1'),
        status: 'returned',
        deliverymanId: new UniqueEntityID('deliveryman-1'),
      }),
    )
  })

  it('should return an error if user does not exist', async () => {
    const order = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      userId: 'invalid-user-id',
      orderId: 'order-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveUsersCanMarkOrdersAsReturnedError,
    )
    expect(result).toEqual(
      left(new OnlyActiveUsersCanMarkOrdersAsReturnedError()),
    )
    expect(await inMemoryOrdersRepository.findById('order-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('order-1'),
        status: expect.any(String), // Unchanged
      }),
    )
  })

  it('should return an error if user is inactive', async () => {
    const deliveryman = makeUser(
      {
        role: 'deliveryman',
        status: 'inactive',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    const order = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
        deliverymanId: new UniqueEntityID('deliveryman-1'),
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryUsersRepository.create(deliveryman)
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      userId: 'deliveryman-1',
      orderId: 'order-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveUsersCanMarkOrdersAsReturnedError,
    )
    expect(result).toEqual(
      left(new OnlyActiveUsersCanMarkOrdersAsReturnedError()),
    )
    expect(await inMemoryOrdersRepository.findById('order-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('order-1'),
        status: expect.any(String), // Unchanged
      }),
    )
  })

  it('should return an error if deliveryman is not assigned to the order', async () => {
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
        deliverymanId: new UniqueEntityID('deliveryman-2'),
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryUsersRepository.create(deliveryman)
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      userId: 'deliveryman-1',
      orderId: 'order-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyAssignedDeliverymanOrAdminCanMarkOrderAsReturnedError,
    )
    expect(result).toEqual(
      left(new OnlyAssignedDeliverymanOrAdminCanMarkOrderAsReturnedError()),
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
      userId: 'admin-1',
      orderId: 'order-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderNotFoundError)
    expect(result).toEqual(left(new OrderNotFoundError()))
    expect(await inMemoryOrdersRepository.findById('order-1')).toBeNull()
  })
})
