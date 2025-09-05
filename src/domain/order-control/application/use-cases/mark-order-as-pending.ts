import { Either, left, right } from '@/core/either'
import { OrdersRepository } from '@/domain/order-control/application/repositories/orders-repository'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { OnlyActiveAdminsCanMarkOrdersAsPendingError } from './errors/only-active-admins-can-mark-orders-as-pending-error'
import { OrderNotFoundError } from './errors/order-not-found-error'
import { Order } from '../../enterprise/entities/order'

interface MarkOrderAsPendingUseCaseRequest {
  adminId: string
  orderId: string
}

type MarkOrderAsPendingUseCaseResponse = Either<
  OrderNotFoundError,
  {
    order: Order
  }
>

export class MarkOrderAsPendingUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    adminId,
    orderId,
  }: MarkOrderAsPendingUseCaseRequest): Promise<MarkOrderAsPendingUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)
    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return left(new OnlyActiveAdminsCanMarkOrdersAsPendingError())
    }

    const order = await this.ordersRepository.findById(orderId)
    if (!order) {
      return left(new OrderNotFoundError())
    }

    order.status = 'pending'

    await this.ordersRepository.save(order)

    return right({ order })
  }
}
