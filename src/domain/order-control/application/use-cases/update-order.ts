import { OrdersRepository } from '@/domain/order-control/application/repositories/orders-repository'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Either, left, right } from '@/core/either'
import { OrderNotFoundError } from './errors/order-not-found-error'
import { Order } from '../../enterprise/entities/order'
import { OnlyActiveAdminsCanUpdateOrdersError } from './errors/only-active-admins-can-update-orders-error'

interface UpdateOrderUseCaseRequest {
  adminId: string
  orderId: string
  recipientId?: string
  street?: string
  number?: string
  neighborhood?: string
  city?: string
  state?: string
  zipCode?: string
}

type UpdateOrderUseCaseResponse = Either<
  OrderNotFoundError | OnlyActiveAdminsCanUpdateOrdersError,
  {
    order: Order
  }
>

export class UpdateOrderUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    adminId,
    orderId,
    recipientId,
    street,
    number,
    neighborhood,
    city,
    state,
    zipCode,
  }: UpdateOrderUseCaseRequest): Promise<UpdateOrderUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)
    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return left(new OnlyActiveAdminsCanUpdateOrdersError())
    }

    const order = await this.ordersRepository.findById(orderId)
    if (!order) {
      return left(new OrderNotFoundError())
    }

    if (recipientId !== undefined) {
      order.recipientId = new UniqueEntityID(recipientId)
    }
    if (street !== undefined) {
      order.street = street
    }
    if (number !== undefined) {
      order.number = number
    }
    if (neighborhood !== undefined) {
      order.neighborhood = neighborhood
    }
    if (city !== undefined) {
      order.city = city
    }
    if (state !== undefined) {
      order.state = state
    }
    if (zipCode !== undefined) {
      order.zipCode = zipCode
    }

    await this.ordersRepository.save(order)

    return right({ order })
  }
}
