import { left } from '@/core/either'
import { OrdersRepository } from '@/domain/order-control/application/repositories/orders-repository'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { OnlyActiveUsersCanMarkOrdersAsReturnedError } from './errors/only-active-users-can-mark-orders-as-returned-error'
import { OrderNotFoundError } from './errors/order-not-found-error'
import { OnlyAssignedDeliverymanOrAdminCanMarkOrderAsReturnedError } from './errors/only-assigned-deliveryman-or-admin-can-mark-order-as-returned-error'

interface MarkOrderAsReturnedUseCaseRequest {
  userId: string
  orderId: string
}

export class MarkOrderAsReturnedUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({ userId, orderId }: MarkOrderAsReturnedUseCaseRequest) {
    const user = await this.usersRepository.findById(userId)
    if (!user || user.status !== 'active') {
      return left(new OnlyActiveUsersCanMarkOrdersAsReturnedError())
    }

    const order = await this.ordersRepository.findById(orderId)
    if (!order) {
      return left(new OrderNotFoundError())
    }

    if (
      user.role === 'deliveryman' &&
      order.deliverymanId?.toString() !== userId
    ) {
      return left(
        new OnlyAssignedDeliverymanOrAdminCanMarkOrderAsReturnedError(),
      )
    }

    order.status = 'returned'

    await this.ordersRepository.save(order)

    return order
  }
}
