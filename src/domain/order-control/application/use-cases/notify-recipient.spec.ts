import { describe, it, expect, beforeEach } from 'vitest'
import { NotifyRecipientUseCase } from './notify-recipient'
import { InMemoryOrdersRepository } from 'test/repositories/in-memory-orders-repository'
import { InMemoryNotificationsRepository } from 'test/repositories/in-memory-notifications-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeOrder } from 'test/factories/make-order'
import { left } from '@/core/either'
import { OrderNotFoundError } from './errors/order-not-found-error'
import { InMemoryOrderAttachmentsRepository } from 'test/repositories/in-memory-order-attachments-repository'

let inMemoryOrderAttachmentsRepository: InMemoryOrderAttachmentsRepository
let inMemoryOrdersRepository: InMemoryOrdersRepository
let inMemoryNotificationsRepository: InMemoryNotificationsRepository
let sut: NotifyRecipientUseCase

describe('Notify Recipient Use Case', () => {
  beforeEach(() => {
    inMemoryOrderAttachmentsRepository =
      new InMemoryOrderAttachmentsRepository()
    inMemoryOrdersRepository = new InMemoryOrdersRepository(
      inMemoryOrderAttachmentsRepository,
    )
    inMemoryNotificationsRepository = new InMemoryNotificationsRepository()
    sut = new NotifyRecipientUseCase(
      inMemoryOrdersRepository,
      inMemoryNotificationsRepository,
    )
  })

  const statuses = ['pending', 'picked_up', 'delivered', 'returned'] as const

  for (const status of statuses) {
    it(`should create a notification for an order with status ${status}`, async () => {
      const order = makeOrder(
        {
          recipientId: new UniqueEntityID('recipient-1'),
        },
        new UniqueEntityID('order-1'),
      )

      await inMemoryOrdersRepository.create(order)

      const result = await sut.execute({
        orderId: 'order-1',
        status,
      })

      expect(result.isRight()).toBe(true)
      expect(result.value).toEqual({
        notification: expect.objectContaining({
          recipientId: new UniqueEntityID('recipient-1'),
          title: 'Order status update',
          content: `Order status updated to ${status}`,
        }),
      })

      expect(inMemoryNotificationsRepository.items).toHaveLength(1)
      expect(inMemoryNotificationsRepository.items[0]).toEqual(
        expect.objectContaining({
          recipientId: new UniqueEntityID('recipient-1'),
          title: 'Order status update',
          content: `Order status updated to ${status}`,
        }),
      )

      expect(await inMemoryOrdersRepository.findById('order-1')).toEqual(
        expect.objectContaining({
          id: new UniqueEntityID('order-1'),
        }),
      )
    })
  }

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
