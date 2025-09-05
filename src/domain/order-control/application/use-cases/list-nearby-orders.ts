import { Order } from '@/domain/order-control/enterprise/entities/order'
import { OrdersRepository } from '@/domain/order-control/application/repositories/orders-repository'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { Either, left, right } from '@/core/either'
import { OnlyActiveDeliverymenCanListNearbyOrdersError } from './errors/only-active-deliverymen-can-list-nearby-orders-error'
import { OnlyActiveAdminsCanListDeliverymenError } from './errors/only-active-admins-can-list-deliverymen-error'

interface ListNearbyOrdersUseCaseRequest {
  deliverymanId: string
  neighborhood: string
}

export class ListNearbyOrdersUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    deliverymanId,
    neighborhood,
  }: ListNearbyOrdersUseCaseRequest): Promise<
    Either<OnlyActiveAdminsCanListDeliverymenError, Order[]>
  > {
    const deliveryman = await this.usersRepository.findById(deliverymanId)
    if (
      !deliveryman ||
      deliveryman.role !== 'deliveryman' ||
      deliveryman.status !== 'active'
    ) {
      return left(new OnlyActiveDeliverymenCanListNearbyOrdersError())
    }
    const nearbyOrders = await this.ordersRepository.findNearby(neighborhood)
    return right(nearbyOrders)
  }
}
