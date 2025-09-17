import { Either, left, right } from '@/core/either'
import { OrdersRepository } from '@/domain/order-control/application/repositories/orders-repository'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { OnlyActiveAdminsCanDeleteOrdersError } from './errors/only-active-admins-can-delete-orders-error'
import { OrderNotFoundError } from './errors/order-not-found-error'
import { Injectable } from '@nestjs/common'

interface DeleteOrderUseCaseRequest {
  adminId: string
  orderId: string
}

type DeleteOrderUseCaseUseCaseResponse = Either<
  OnlyActiveAdminsCanDeleteOrdersError | OrderNotFoundError,
  null
>

@Injectable()
export class DeleteOrderUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    adminId,
    orderId,
  }: DeleteOrderUseCaseRequest): Promise<DeleteOrderUseCaseUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)
    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return left(new OnlyActiveAdminsCanDeleteOrdersError())
    }

    const order = await this.ordersRepository.findById(orderId)
    if (!order) {
      return left(new OrderNotFoundError())
    }

    await this.ordersRepository.delete(orderId)

    return right(null)
  }
}
