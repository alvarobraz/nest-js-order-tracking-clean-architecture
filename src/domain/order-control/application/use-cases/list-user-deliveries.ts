import { Either, left, right } from '@/core/either'
import type { OrdersRepository } from '@/domain/order-control/application/repositories/orders-repository'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { Order } from '@/domain/order-control/enterprise/entities/order'

import { UserNotFoundError } from './errors/user-not-found-error'
import { OnlyActiveAdminsCanListDeliverymenError } from './errors/only-active-admins-can-list-deliverymen-error'
import { UserNotDeliverymanError } from './errors/user-not-deliveryman-error'
import { Inject, Injectable } from '@nestjs/common'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

interface ListUserDeliveriesUseCaseRequest {
  adminId: string
  userId: string
}

type ListUserDeliveriesUseCaseResponse = Either<
  | OnlyActiveAdminsCanListDeliverymenError
  | UserNotFoundError
  | UserNotDeliverymanError,
  Order[]
>

@Injectable()
export class ListUserDeliveriesUseCase {
  constructor(
    @Inject('OrdersRepository') private ordersRepository: OrdersRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    adminId,
    userId,
  }: ListUserDeliveriesUseCaseRequest): Promise<ListUserDeliveriesUseCaseResponse> {
    const requester = await this.usersRepository.findById(adminId)
    if (!requester) {
      return left(new UserNotFoundError())
    }

    if (requester.role === 'admin' && requester.status === 'active') {
      const deliveryman = await this.usersRepository.findById(userId)
      if (!deliveryman) {
        return left(new UserNotFoundError())
      }

      if (deliveryman.role !== 'deliveryman') {
        return left(new UserNotDeliverymanError())
      }

      const deliveries = await this.ordersRepository.findByDeliverymanId(userId)
      const deliveredOrders = deliveries.filter(
        (order) => order.status === 'delivered',
      )
      return right(deliveredOrders)
    }

    if (
      requester.role === 'deliveryman' &&
      requester.id.equals(new UniqueEntityID(userId))
    ) {
      const deliveries = await this.ordersRepository.findByDeliverymanId(userId)
      const deliveredOrders = deliveries.filter(
        (order) => order.status === 'delivered',
      )
      return right(deliveredOrders)
    }

    return left(new OnlyActiveAdminsCanListDeliverymenError())
  }
}
