import { describe, it, expect, beforeEach } from 'vitest'
import { NotifyRecipientUseCase } from './notify-recipient'
import { InMemoryOrdersRepository } from 'test/repositories/in-memory-orders-repository'
import { InMemoryNotificationsRepository } from 'test/repositories/in-memory-notifications-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeOrder } from 'test/factories/make-order'
import { left } from '@/core/either'
import { OrderNotFoundError } from './errors/order-not-found-error'

let inMemoryOrdersRepository: InMemoryOrdersRepository
let inMemoryNotificationsRepository: InMemoryNotificationsRepository
let sut: NotifyRecipientUseCase

describe('Notify Recipient Use Case', () => {
  beforeEach(() => {
    inMemoryOrdersRepository = new InMemoryOrdersRepository()
    inMemoryNotificationsRepository = new InMemoryNotificationsRepository()
    sut = new NotifyRecipientUseCase(
      inMemoryOrdersRepository,
      inMemoryNotificationsRepository,
    )
  })

  it('should create a notification for an order with status pending', async () => {
    const order = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      orderId: 'order-1',
      status: 'pending',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      notification: expect.objectContaining({
        orderId: new UniqueEntityID('order-1'),
        message: 'Order status updated to pending',
        type: 'email',
      }),
    })
    expect(inMemoryNotificationsRepository.items).toHaveLength(1)
    expect(inMemoryNotificationsRepository.items[0]).toEqual(
      expect.objectContaining({
        orderId: new UniqueEntityID('order-1'),
        message: 'Order status updated to pending',
        type: 'email',
      }),
    )
    expect(await inMemoryOrdersRepository.findById('order-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('order-1'),
      }),
    )
  })

  it('should create a notification for an order with status picked_up', async () => {
    const order = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      orderId: 'order-1',
      status: 'picked_up',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      notification: expect.objectContaining({
        orderId: new UniqueEntityID('order-1'),
        message: 'Order status updated to picked_up',
        type: 'email',
      }),
    })
    expect(inMemoryNotificationsRepository.items).toHaveLength(1)
    expect(inMemoryNotificationsRepository.items[0]).toEqual(
      expect.objectContaining({
        orderId: new UniqueEntityID('order-1'),
        message: 'Order status updated to picked_up',
        type: 'email',
      }),
    )
    expect(await inMemoryOrdersRepository.findById('order-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('order-1'),
      }),
    )
  })

  it('should create a notification for an order with status delivered', async () => {
    const order = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      orderId: 'order-1',
      status: 'delivered',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      notification: expect.objectContaining({
        orderId: new UniqueEntityID('order-1'),
        message: 'Order status updated to delivered',
        type: 'email',
      }),
    })
    expect(inMemoryNotificationsRepository.items).toHaveLength(1)
    expect(inMemoryNotificationsRepository.items[0]).toEqual(
      expect.objectContaining({
        orderId: new UniqueEntityID('order-1'),
        message: 'Order status updated to delivered',
        type: 'email',
      }),
    )
    expect(await inMemoryOrdersRepository.findById('order-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('order-1'),
      }),
    )
  })

  it('should create a notification for an order with status returned', async () => {
    const order = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      orderId: 'order-1',
      status: 'returned',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      notification: expect.objectContaining({
        orderId: new UniqueEntityID('order-1'),
        message: 'Order status updated to returned',
        type: 'email',
      }),
    })
    expect(inMemoryNotificationsRepository.items).toHaveLength(1)
    expect(inMemoryNotificationsRepository.items[0]).toEqual(
      expect.objectContaining({
        orderId: new UniqueEntityID('order-1'),
        message: 'Order status updated to returned',
        type: 'email',
      }),
    )
    expect(await inMemoryOrdersRepository.findById('order-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('order-1'),
      }),
    )
  })

  it('should return an error if order does not exist', async () => {
    const result = await sut.execute({
      orderId: 'order-1',
      status: 'pending',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderNotFoundError)
    expect(result).toEqual(left(new OrderNotFoundError()))
    expect(inMemoryNotificationsRepository.items).toHaveLength(0)
    expect(await inMemoryOrdersRepository.findById('order-1')).toBeNull()
  })
})
