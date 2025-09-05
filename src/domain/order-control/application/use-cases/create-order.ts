import { Order } from '@/domain/order-control/enterprise/entities/order'
import { OrdersRepository } from '@/domain/order-control/application/repositories/orders-repository'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Either, left, right } from '@/core/either'
import { OnlyActiveAdminsCanCreateOrdersError } from './errors/only-active-admins-can-create-orders-error'

interface CreateOrderUseCaseRequest {
  adminId: string
  recipientId: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
}

type CreateOrderUseCaseResponse = Either<
  OnlyActiveAdminsCanCreateOrdersError,
  {
    order: Order
  }
>

export class CreateOrderUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    adminId,
    recipientId,
    street,
    number,
    neighborhood,
    city,
    state,
    zipCode,
  }: CreateOrderUseCaseRequest): Promise<CreateOrderUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)
    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return left(new OnlyActiveAdminsCanCreateOrdersError())
    }

    const order = Order.create({
      recipientId: new UniqueEntityID(recipientId),
      street,
      number,
      neighborhood,
      city,
      state,
      zipCode,
      status: 'pending',
    })

    await this.ordersRepository.create(order)

    return right({
      order,
    })
  }
}
