import { DomainEvent } from '@/core/events/domain-event'
import { Order } from '../entities/order'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

export class OrderReturnedEvent implements DomainEvent {
  public readonly occurredAt: Date
  public readonly order: Order

  constructor(order: Order) {
    this.order = order
    this.occurredAt = new Date()
  }

  getAggregateId(): UniqueEntityID {
    return this.order.id
  }
}
