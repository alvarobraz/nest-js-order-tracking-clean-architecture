import { Order } from '@/domain/order-control/enterprise/entities/order'
import { OrdersRepository } from '@/domain/order-control/application/repositories/orders-repository'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { Either, left, right } from '@/core/either'
import { OnlyActiveAdminsCanListOrdersError } from './errors/only-active-admins-can-list-orders-error'

interface ListOrdersUseCaseRequest {
  adminId: string
}

type ListOrdersUseCaseResponse = Either<
  OnlyActiveAdminsCanListOrdersError,
  Order[]
>

export class ListOrdersUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    adminId,
  }: ListOrdersUseCaseRequest): Promise<ListOrdersUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)
    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return left(new OnlyActiveAdminsCanListOrdersError())
    }

    const listOrders = await this.ordersRepository.findAll()
    return right(listOrders)
  }
}
