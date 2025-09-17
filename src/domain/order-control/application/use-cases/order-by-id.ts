import { Either, left, right } from '@/core/either'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { OrdersRepository } from '@/domain/order-control/application/repositories/orders-repository'
import { Order } from '@/domain/order-control/enterprise/entities/order'
import { OnlyActiveAdminsCanListOrdersError } from './errors/only-active-admins-can-list-orders-error'
import { Injectable } from '@nestjs/common'
import { OrderNotFoundError } from './errors/order-not-found-error'

interface OrderByIdUseCaseRequest {
  adminId: string
  orderId: string
}

type OrderByIdUseCaseResponse = Either<
  OnlyActiveAdminsCanListOrdersError | OrderNotFoundError,
  Order
>

@Injectable()
export class OrderByIdUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private ordersRepository: OrdersRepository,
  ) {}

  async execute({
    adminId,
    orderId,
  }: OrderByIdUseCaseRequest): Promise<OrderByIdUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)
    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return left(new OnlyActiveAdminsCanListOrdersError())
    }

    const order = await this.ordersRepository.findById(orderId)

    if (!order) {
      return left(new OrderNotFoundError())
    }

    return right(order)
  }
}
