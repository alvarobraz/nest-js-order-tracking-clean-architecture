import { vi, MockInstance } from 'vitest'
import { OnOrderPickUp } from '@/domain/notification/application/subscribers/or-order-picked-up'
import { makeOrder } from 'test/factories/make-order'
import { makeUser } from 'test/factories/make-users'
import { InMemoryNotificationsRepository } from 'test/repositories/in-memory-notifications-repository'
import { InMemoryOrdersRepository } from 'test/repositories/in-memory-orders-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import {
  SendNotificationUseCase,
  SendNotificationUseCaseRequest,
  SendNotificationUseCaseResponse,
} from '../use-cases/send-notification'
import { PickUpOrderUseCase } from '@/domain/order-control/application/use-cases/pick-up-order'
import { waitFor } from 'test/utils/wait-for'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { InMemoryOrderAttachmentsRepository } from 'test/repositories/in-memory-order-attachments-repository'

let inMemoryOrdersRepository: InMemoryOrdersRepository
let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryNotificationsRepository: InMemoryNotificationsRepository
let sendNotificationUseCase: SendNotificationUseCase
let pickUpOrderUseCase: PickUpOrderUseCase
let inMemoryOrderAttachmentsRepository: InMemoryOrderAttachmentsRepository

let sendNotificationExecuteSpy: MockInstance<
  (
    args: SendNotificationUseCaseRequest,
  ) => Promise<SendNotificationUseCaseResponse>
>

describe('On Order Picked Up', () => {
  beforeEach(() => {
    inMemoryOrderAttachmentsRepository =
      new InMemoryOrderAttachmentsRepository()
    inMemoryOrdersRepository = new InMemoryOrdersRepository(
      inMemoryOrderAttachmentsRepository,
    )
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryNotificationsRepository = new InMemoryNotificationsRepository()
    sendNotificationUseCase = new SendNotificationUseCase(
      inMemoryNotificationsRepository,
    )
    pickUpOrderUseCase = new PickUpOrderUseCase(
      inMemoryOrdersRepository,
      inMemoryUsersRepository,
    )

    sendNotificationExecuteSpy = vi.spyOn(sendNotificationUseCase, 'execute')

    new OnOrderPickUp(inMemoryOrdersRepository, sendNotificationUseCase)
  })

  it('should send a notification when an order is picked up', async () => {
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
        status: 'pending',
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryUsersRepository.create(deliveryman)
    await inMemoryOrdersRepository.create(order)

    await pickUpOrderUseCase.execute({
      deliverymanId: 'deliveryman-1',
      orderId: 'order-1',
    })

    await waitFor(() => {
      expect(sendNotificationExecuteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: 'recipient-1',
          title: `Pedido "recipient-1" retirado`,
          content: `O pedido com destinatário "recipient-1" foi retirado e está com status "picked_up"`,
        }),
      )
    })
  })
})
