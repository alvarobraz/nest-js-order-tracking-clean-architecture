import { Order } from '@/domain/order-control/enterprise/entities/order'
import { OrdersRepository } from '@/domain/order-control/application/repositories/orders-repository'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { Either, left, right } from '@/core/either'
import { OnlyActiveAdminsCanListOrdersError } from './errors/only-active-admins-can-list-orders-error'
import { Injectable } from '@nestjs/common'

interface ListOrdersUseCaseRequest {
  adminId: string
  page: number
}

type ListOrdersUseCaseResponse = Either<
  OnlyActiveAdminsCanListOrdersError,
  Order[]
>

@Injectable()
export class ListOrdersUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    adminId,
    page,
  }: ListOrdersUseCaseRequest): Promise<ListOrdersUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)
    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return left(new OnlyActiveAdminsCanListOrdersError())
    }

    const listOrders = await this.ordersRepository.findAll({ page })
    return right(listOrders)
  }
}
