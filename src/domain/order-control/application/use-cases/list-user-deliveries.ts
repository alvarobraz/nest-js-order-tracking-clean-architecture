import { Either, left, right } from '@/core/either'
import type { OrdersRepository } from '@/domain/order-control/application/repositories/orders-repository'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { Order } from '@/domain/order-control/enterprise/entities/order'

import { UserNotFoundError } from './errors/user-not-found-error'
import { OnlyActiveAdminsCanListDeliverymenError } from './errors/only-active-admins-can-list-deliverymen-error'
import { UserNotDeliverymanError } from './errors/user-not-deliveryman-error'
import { Injectable } from '@nestjs/common'

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
    private ordersRepository: OrdersRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    adminId,
    userId,
  }: ListUserDeliveriesUseCaseRequest): Promise<ListUserDeliveriesUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)
    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return left(new OnlyActiveAdminsCanListDeliverymenError())
    }

    const deliveryman = await this.usersRepository.findById(userId)
    if (!deliveryman) {
      return left(new UserNotFoundError())
    }

    if (deliveryman.role !== 'deliveryman') {
      return left(new UserNotDeliverymanError())
    }

    const deliveries = await this.ordersRepository.findByDeliverymanId(userId)
    return right(deliveries)
  }
}
