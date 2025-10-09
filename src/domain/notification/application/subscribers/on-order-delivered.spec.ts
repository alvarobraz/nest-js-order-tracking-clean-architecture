import { vi, MockInstance } from 'vitest'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { waitFor } from 'test/utils/wait-for'
import { makeOrder } from 'test/factories/make-order'
import { makeUser } from 'test/factories/make-users'
import { makeRecipient } from 'test/factories/make-recipient'
import { makeAttachment } from 'test/factories/make-attachment'

import { OrderAttachment } from '@/domain/order-control/enterprise/entities/order-attachment'

import { InMemoryRecipientsRepository } from 'test/repositories/in-memory-recipients-repository'
import { InMemoryNotificationsRepository } from 'test/repositories/in-memory-notifications-repository'
import { InMemoryOrdersRepository } from 'test/repositories/in-memory-orders-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { InMemoryOrderAttachmentsRepository } from 'test/repositories/in-memory-order-attachments-repository'

import { SendNotificationUseCase } from '@/domain/notification/application/use-cases/send-notification'
import { DeliveredOrderUseCase } from '@/domain/order-control/application/use-cases/delivered-order'
import { OnOrderDelivered } from '@/domain/notification/application/subscribers/on-order-delivered'

let inMemoryOrdersRepository: InMemoryOrdersRepository
let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryRecipientsRepository: InMemoryRecipientsRepository
let inMemoryNotificationsRepository: InMemoryNotificationsRepository
let sendNotificationUseCase: SendNotificationUseCase
let deliveredOrderUseCase: DeliveredOrderUseCase
let inMemoryOrderAttachmentsRepository: InMemoryOrderAttachmentsRepository

let sendNotificationExecuteSpy: MockInstance

describe('On Order Delivered', () => {
  beforeEach(() => {
    inMemoryOrderAttachmentsRepository =
      new InMemoryOrderAttachmentsRepository()

    inMemoryOrdersRepository = new InMemoryOrdersRepository(
      inMemoryOrderAttachmentsRepository,
    )
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryRecipientsRepository = new InMemoryRecipientsRepository()
    inMemoryNotificationsRepository = new InMemoryNotificationsRepository()

    sendNotificationUseCase = new SendNotificationUseCase(
      inMemoryNotificationsRepository,
    )

    deliveredOrderUseCase = new DeliveredOrderUseCase(
      inMemoryOrdersRepository,
      inMemoryOrderAttachmentsRepository,
      inMemoryUsersRepository,
    )

    sendNotificationExecuteSpy = vi.spyOn(sendNotificationUseCase, 'execute')

    new OnOrderDelivered(inMemoryRecipientsRepository, sendNotificationUseCase)
  })

  it('should send a notification when an order is delivered', async () => {
    const deliveryman = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    const recipientUser = makeUser(
      {
        role: 'recipient',
        status: 'active',
      },
      new UniqueEntityID('user-recipient-1'),
    )

    const recipient = makeRecipient(
      {
        userId: recipientUser.id.toString(),
      },
      new UniqueEntityID('recipient-1'),
    )

    const order = makeOrder(
      {
        recipientId: recipient.id,
        status: 'picked_up',
        deliverymanId: deliveryman.id,
      },
      new UniqueEntityID('order-1'),
    )

    const attachment = makeAttachment({}, new UniqueEntityID('attachment-1'))

    const orderAttachment = OrderAttachment.create(
      {
        attachmentId: attachment.id,
        orderId: order.id,
      },
      new UniqueEntityID('order-attachment-1'),
    )

    await inMemoryUsersRepository.create(deliveryman)
    await inMemoryUsersRepository.create(recipientUser)
    await inMemoryRecipientsRepository.create(recipient)
    await inMemoryOrdersRepository.create(order)
    await inMemoryOrderAttachmentsRepository.createMany([orderAttachment])

    await deliveredOrderUseCase.execute({
      deliverymanId: 'deliveryman-1',
      orderId: 'order-1',
      deliveryPhotoIds: ['attachment-1'],
    })

    await waitFor(() => {
      expect(sendNotificationExecuteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: 'user-recipient-1',
          title: `Pedido "order-1" entregue`,
          content: `O pedido com destinatário "user-recipient-1" foi entregue e está com status "delivered"`,
        }),
      )
    })
  })
})
