import { vi, MockInstance } from 'vitest'
import { makeOrder } from 'test/factories/make-order'
import { makeUser } from 'test/factories/make-users'
import { InMemoryNotificationsRepository } from 'test/repositories/in-memory-notifications-repository'
import { InMemoryOrdersRepository } from 'test/repositories/in-memory-orders-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { InMemoryOrderAttachmentsRepository } from 'test/repositories/in-memory-order-attachments-repository'
import {
  SendNotificationUseCase,
  SendNotificationUseCaseRequest,
  SendNotificationUseCaseResponse,
} from '../use-cases/send-notification'
import { MarkOrderAsDeliveredUseCase } from '@/domain/order-control/application/use-cases/mark-order-as-delivered'
import { waitFor } from 'test/utils/wait-for'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { OnOrderDelivered } from './on-order-delivered'

let inMemoryOrdersRepository: InMemoryOrdersRepository
let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryOrderAttachmentsRepository: InMemoryOrderAttachmentsRepository
let inMemoryNotificationsRepository: InMemoryNotificationsRepository
let sendNotificationUseCase: SendNotificationUseCase
let markOrderAsDeliveredUseCase: MarkOrderAsDeliveredUseCase

let sendNotificationExecuteSpy: MockInstance<
  (
    args: SendNotificationUseCaseRequest,
  ) => Promise<SendNotificationUseCaseResponse>
>

describe('On Order Delivered', () => {
  beforeEach(() => {
    inMemoryOrdersRepository = new InMemoryOrdersRepository()
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryOrderAttachmentsRepository =
      new InMemoryOrderAttachmentsRepository()
    inMemoryNotificationsRepository = new InMemoryNotificationsRepository()
    sendNotificationUseCase = new SendNotificationUseCase(
      inMemoryNotificationsRepository,
    )
    markOrderAsDeliveredUseCase = new MarkOrderAsDeliveredUseCase(
      inMemoryOrdersRepository,
      inMemoryOrderAttachmentsRepository,
      inMemoryUsersRepository,
    )

    sendNotificationExecuteSpy = vi.spyOn(sendNotificationUseCase, 'execute')

    new OnOrderDelivered(inMemoryOrdersRepository, sendNotificationUseCase)
  })

  it('should send a notification when an order is delivered', async () => {
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

    await markOrderAsDeliveredUseCase.execute({
      deliverymanId: 'deliveryman-1',
      orderId: 'order-1',
      deliveryPhotoIds: ['photo-1', 'photo-2'],
    })

    await waitFor(() => {
      expect(sendNotificationExecuteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: 'recipient-1',
          title: `Pedido "recipient-1" entregue`,
          content: `O pedido com destinatário "recipient-1" foi entregue e está com status "delivered"`,
        }),
      )
    })
  })
})
