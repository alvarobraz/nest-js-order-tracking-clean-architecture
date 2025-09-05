import { Notification } from '@/domain/order-control/enterprise/entities/notification'
import { NotificationsRepository } from '@/domain/order-control/application/repositories/notifications-repository'
import { OrdersRepository } from '@/domain/order-control/application/repositories/orders-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { OrderNotFoundError } from './errors/order-not-found-error'
import { Either, left, right } from '@/core/either'

interface NotifyRecipientUseCaseRequest {
  orderId: string
  status: 'pending' | 'picked_up' | 'delivered' | 'returned'
}

type NotifyRecipientUseCaseResponse = Either<
  OrderNotFoundError,
  {
    notification: Notification
  }
>

export class NotifyRecipientUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private notificationsRepository: NotificationsRepository,
  ) {}

  async execute({
    orderId,
    status,
  }: NotifyRecipientUseCaseRequest): Promise<NotifyRecipientUseCaseResponse> {
    const order = await this.ordersRepository.findById(orderId)
    if (!order) {
      return left(new OrderNotFoundError())
    }

    const notification = Notification.create({
      orderId: new UniqueEntityID(orderId),
      message: `Order status updated to ${status}`,
      type: 'email',
    })

    await this.notificationsRepository.create(notification)

    return right({ notification })
  }
}
