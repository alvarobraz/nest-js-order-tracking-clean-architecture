import { Either, left, right } from '@/core/either'
import { OrdersRepository } from '@/domain/order-control/application/repositories/orders-repository'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { OnlyActiveUsersCanMarkOrdersAsReturnedError } from './errors/only-active-users-can-mark-orders-as-returned-error'
import { OrderNotFoundError } from './errors/order-not-found-error'
import { OnlyAssignedDeliverymanOrAdminCanMarkOrderAsReturnedError } from './errors/only-assigned-deliveryman-or-admin-can-mark-order-as-returned-error'
import { Order } from '../../enterprise/entities/order'
import { Injectable } from '@nestjs/common'
import { DomainEvents } from '@/core/events/domain-events'

interface MarkOrderAsReturnedUseCaseRequest {
  userId: string
  orderId: string
}

type MarkOrderAsReturnedUseCaseResponse = Either<
  | OnlyActiveUsersCanMarkOrdersAsReturnedError
  | OrderNotFoundError
  | OnlyAssignedDeliverymanOrAdminCanMarkOrderAsReturnedError,
  {
    order: Order | void
  }
>

@Injectable()
export class MarkOrderAsReturnedUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    userId,
    orderId,
  }: MarkOrderAsReturnedUseCaseRequest): Promise<MarkOrderAsReturnedUseCaseResponse> {
    const user = await this.usersRepository.findById(userId)
    if (!user || user.status !== 'active') {
      return left(new OnlyActiveUsersCanMarkOrdersAsReturnedError())
    }

    const order = await this.ordersRepository.findById(orderId)
    if (!order) {
      return left(new OrderNotFoundError())
    }

    if (
      user.role === 'deliveryman' &&
      order.deliverymanId?.toString() !== userId
    ) {
      return left(
        new OnlyAssignedDeliverymanOrAdminCanMarkOrderAsReturnedError(),
      )
    }

    order.status = 'returned'

    await this.ordersRepository.save(order)

    // console.log('order uc =>' + JSON.stringify(order))

    DomainEvents.markAggregateForDispatch(order)
    DomainEvents.dispatchEventsForAggregate(order.id)

    return right({ order })
  }
}
