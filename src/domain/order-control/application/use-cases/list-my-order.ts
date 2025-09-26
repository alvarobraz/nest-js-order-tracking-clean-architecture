import { Either, left, right } from '@/core/either'
import type { OrdersRepository } from '@/domain/order-control/application/repositories/orders-repository'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { Order } from '@/domain/order-control/enterprise/entities/order'
import { UserNotFoundError } from './errors/user-not-found-error'
import { UserNotDeliverymanError } from './errors/user-not-deliveryman-error'
import { Injectable, Inject } from '@nestjs/common'
import { OnlyActiveDeliverymenCanListOrdersError } from './errors/only-active-deliverymen-can-list-orders-error'

interface ListMyOrderUseCaseRequest {
  userId: string
}

type ListMyOrderUseCaseResponse = Either<
  | UserNotFoundError
  | UserNotDeliverymanError
  | OnlyActiveDeliverymenCanListOrdersError,
  Order[]
>

@Injectable()
export class ListMyOrderUseCase {
  constructor(
    @Inject('OrdersRepository') private ordersRepository: OrdersRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    userId,
  }: ListMyOrderUseCaseRequest): Promise<ListMyOrderUseCaseResponse> {
    const user = await this.usersRepository.findById(userId)
    if (!user) {
      return left(new UserNotFoundError())
    }

    if (user.role !== 'deliveryman') {
      return left(new UserNotDeliverymanError())
    }

    if (user.status !== 'active') {
      return left(new OnlyActiveDeliverymenCanListOrdersError())
    }

    const orders = await this.ordersRepository.findByDeliverymanId(userId)

    return right(orders)
  }
}
