import { Notification } from '@/domain/notification/enterprise/entities/notification'
import { NotificationsRepository } from '@/domain/notification/application/repositories/notifications-repository'
import { OrdersRepository } from '@/domain/order-control/application/repositories/orders-repository'
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
      recipientId: order.recipientId,
      title: 'Order status update',
      content: `Order status updated to ${status}`,
    })

    await this.notificationsRepository.create(notification)

    return right({ notification })
  }
}
