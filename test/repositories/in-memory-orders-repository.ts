import { Order } from '@/domain/order-control/enterprise/entities/order'
import { OrdersRepository } from '@/domain/order-control/application/repositories/orders-repository'
import { DomainEvents } from '@/core/events/domain-events'
import { Recipient } from '@/domain/order-control/enterprise/entities/recipient'
import { PaginationParams } from '@/core/repositories/pagination-params'
import { OrderAttachmentsRepository } from '@/domain/order-control/application/repositories/orders-attachments-repository'

export class InMemoryOrdersRepository implements OrdersRepository {
  public items: (Order & { recipient?: Recipient })[] = []

  constructor(private orderAttachmentsRepository: OrderAttachmentsRepository) {}

  async create(order: Order & { recipient?: Recipient }): Promise<void> {
    this.items.push(order)

    await this.orderAttachmentsRepository.createMany(
      order.deliveryPhoto?.getItems?.() ?? [],
    )

    DomainEvents.dispatchEventsForAggregate(order.id)
  }

  async findById(
    id: string,
  ): Promise<(Order & { recipient?: Recipient }) | null> {
    const order = this.items.find((item) => item.id.toString() === id)
    return order || null
  }

  async save(order: Order & { recipient?: Recipient }): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === order.id.toString(),
    )
    if (index >= 0) {
      this.items[index] = order
    }

    await this.orderAttachmentsRepository.createMany(
      order.deliveryPhoto.getNewItems(),
    )

    await this.orderAttachmentsRepository.deleteMany(
      order.deliveryPhoto.getRemovedItems(),
    )

    DomainEvents.dispatchEventsForAggregate(order.id)
    // return order
  }

  async delete(id: string): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === id)
    if (index >= 0) {
      this.items.splice(index, 1)
    }
  }

  async findAll({
    page,
  }: PaginationParams): Promise<(Order & { recipient?: Recipient })[]> {
    const perPage = 20
    const start = (page - 1) * perPage
    const end = start + perPage
    return this.items.slice(start, end)
  }

  async findNearby(
    neighborhood: string,
  ): Promise<(Order & { recipient?: Recipient })[]> {
    return this.items.filter((item) =>
      item.recipient?.neighborhood
        .toLowerCase()
        .includes(neighborhood.toLowerCase()),
    )
  }

  async findByDeliverymanId(
    deliverymanId: string,
  ): Promise<(Order & { recipient?: Recipient })[]> {
    return this.items.filter(
      (order) => order.deliverymanId?.toString() === deliverymanId,
    )
  }
}
