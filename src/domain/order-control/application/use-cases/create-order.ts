import { Order } from '@/domain/order-control/enterprise/entities/order'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Either, left, right } from '@/core/either'
import { OnlyActiveAdminsCanCreateOrdersError } from './errors/only-active-admins-can-create-orders-error'

import { RecipientNotFoundError } from './errors/recipient-not-found-error'
import { Inject, Injectable } from '@nestjs/common'
import { OrdersRepository } from '@/domain/order-control/application/repositories/orders-repository'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { RecipientsRepository } from '@/domain/order-control/application/repositories/recipients-repository'

interface CreateOrderUseCaseRequest {
  adminId: string
  recipientId: string
}

type CreateOrderUseCaseResponse = Either<
  OnlyActiveAdminsCanCreateOrdersError,
  {
    order: Order
  }
>

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject('OrdersRepository') private ordersRepository: OrdersRepository,
    private usersRepository: UsersRepository,
    @Inject('RecipientsRepository')
    private recipientsRepository: RecipientsRepository,
  ) {}

  async execute({
    adminId,
    recipientId,
  }: CreateOrderUseCaseRequest): Promise<CreateOrderUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)
    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return left(new OnlyActiveAdminsCanCreateOrdersError())
    }

    const recipient = await this.recipientsRepository.findById(recipientId)
    if (!recipient) {
      return left(new RecipientNotFoundError())
    }

    const order = Order.create({
      recipientId: new UniqueEntityID(recipientId),
      status: 'pending',
    })

    await this.ordersRepository.create(order)

    return right({
      order,
    })
  }
}
