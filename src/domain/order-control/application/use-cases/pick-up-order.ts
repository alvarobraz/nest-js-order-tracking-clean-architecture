import { OrdersRepository } from '@/domain/order-control/application/repositories/orders-repository'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Either, left, right } from '@/core/either'
import { OrderNotFoundError } from './errors/order-not-found-error'
import { OnlyActiveDeliverymenCanPickUpOrdersError } from './errors/only-active-deliverymen-can-pick-up-orders-error'
import { OrderMustBePendingToBePickedUpError } from './errors/order-must-be-pending-to-be-picked-up-error'
import { Injectable } from '@nestjs/common'
import { Order } from '../../enterprise/entities/order'
import { Recipient } from '../../enterprise/entities/recipient'
import { DomainEvents } from '@/core/events/domain-events'

interface PickUpOrderUseCaseRequest {
  deliverymanId: string
  orderId: string
}

type PickUpOrderUseCaseResponse = Either<
  | OnlyActiveDeliverymenCanPickUpOrdersError
  | OrderNotFoundError
  | OrderMustBePendingToBePickedUpError,
  {
    order: Order & { recipient?: Recipient }
  }
>

@Injectable()
export class PickUpOrderUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    deliverymanId,
    orderId,
  }: PickUpOrderUseCaseRequest): Promise<PickUpOrderUseCaseResponse> {
    const deliveryman = await this.usersRepository.findById(deliverymanId)
    if (
      !deliveryman ||
      deliveryman.role !== 'deliveryman' ||
      deliveryman.status !== 'active'
    ) {
      return left(new OnlyActiveDeliverymenCanPickUpOrdersError())
    }

    const order = await this.ordersRepository.findById(orderId)
    if (!order) {
      return left(new OrderNotFoundError())
    }

    if (order.status !== 'pending') {
      return left(new OrderMustBePendingToBePickedUpError())
    }

    order.deliverymanId = new UniqueEntityID(deliverymanId)
    order.status = 'picked_up'

    await this.ordersRepository.save(order)

    DomainEvents.markAggregateForDispatch(order)
    DomainEvents.dispatchEventsForAggregate(order.id)

    return right({ order })
  }
}
