import { vi, MockInstance } from 'vitest'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { waitFor } from 'test/utils/wait-for'
import { makeOrder } from 'test/factories/make-order'
import { makeUser } from 'test/factories/make-users'
import { makeRecipient } from 'test/factories/make-recipient'

import { InMemoryRecipientsRepository } from 'test/repositories/in-memory-recipients-repository'
import { InMemoryNotificationsRepository } from 'test/repositories/in-memory-notifications-repository'
import { InMemoryOrdersRepository } from 'test/repositories/in-memory-orders-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { InMemoryOrderAttachmentsRepository } from 'test/repositories/in-memory-order-attachments-repository'

import { SendNotificationUseCase } from '@/domain/notification/application/use-cases/send-notification'
import { PickUpOrderUseCase } from '@/domain/order-control/application/use-cases/pick-up-order'
import { OnOrderPickUp } from '@/domain/notification/application/subscribers/or-order-picked-up'

let inMemoryOrdersRepository: InMemoryOrdersRepository
let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryRecipientsRepository: InMemoryRecipientsRepository
let inMemoryNotificationsRepository: InMemoryNotificationsRepository
let sendNotificationUseCase: SendNotificationUseCase
let pickUpOrderUseCase: PickUpOrderUseCase
let inMemoryOrderAttachmentsRepository: InMemoryOrderAttachmentsRepository

let sendNotificationExecuteSpy: MockInstance

describe('On Order Picked Up', () => {
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

    pickUpOrderUseCase = new PickUpOrderUseCase(
      inMemoryOrdersRepository,
      inMemoryUsersRepository,
    )

    sendNotificationExecuteSpy = vi.spyOn(sendNotificationUseCase, 'execute')

    new OnOrderPickUp(
      inMemoryOrdersRepository,
      inMemoryRecipientsRepository,
      sendNotificationUseCase,
    )
  })

  it('should send a notification when an order is picked up', async () => {
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
        status: 'pending',
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryUsersRepository.create(deliveryman)
    await inMemoryUsersRepository.create(recipientUser)
    await inMemoryRecipientsRepository.create(recipient)
    await inMemoryOrdersRepository.create(order)

    await pickUpOrderUseCase.execute({
      deliverymanId: 'deliveryman-1',
      orderId: 'order-1',
    })

    await waitFor(() => {
      expect(sendNotificationExecuteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: 'user-recipient-1',
          title: `Pedido "order-1" retirado`,
          content: `O pedido com destinatário "user-recipient-1" foi retirado e está com status "picked_up"`,
        }),
      )
    })
  })
})
