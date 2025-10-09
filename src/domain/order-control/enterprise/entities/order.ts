import { AggregateRoot } from '@/core/entities/aggregate-root'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import { OrderAttachmentList } from './order-attachment-list'
import { OrderCreatedEvent } from '../events/order-created-event'
import { OrderPickedUpEvent } from '../events/order-picked-up-event'
import { OrderDeliveredEvent } from '../events/order-delivered-event'
import { OrderReturnedEvent } from '../events/order-returned-event'

export interface OrderProps {
  recipientId: UniqueEntityID
  deliverymanId?: UniqueEntityID
  status: 'pending' | 'picked_up' | 'delivered' | 'returned'
  deliveryPhoto: OrderAttachmentList
  createdAt: Date
  updatedAt?: Date | null
}

export class Order extends AggregateRoot<OrderProps> {
  get recipientId() {
    return this.props.recipientId
  }

  get deliverymanId() {
    return this.props.deliverymanId
  }

  get status() {
    return this.props.status
  }

  get deliveryPhoto() {
    return this.props.deliveryPhoto
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  set recipientId(recipientId: UniqueEntityID) {
    this.props.recipientId = recipientId
    this.touch()
  }

  set deliverymanId(deliverymanId: UniqueEntityID | undefined) {
    this.props.deliverymanId = deliverymanId
    this.touch()
  }

  set status(status: 'pending' | 'picked_up' | 'delivered' | 'returned') {
    if (status === 'picked_up' && this.props.status !== 'picked_up') {
      this.addDomainEvent(new OrderPickedUpEvent(this))
    }
    if (status === 'returned' && this.props.status !== 'returned') {
      this.addDomainEvent(new OrderReturnedEvent(this))
    }
    if (status === 'delivered' && this.props.status !== 'delivered') {
      this.addDomainEvent(new OrderDeliveredEvent(this))
    }
    this.props.status = status
    this.touch()
  }

  set deliveryPhoto(deliveryPhoto: OrderAttachmentList) {
    this.props.deliveryPhoto = deliveryPhoto
    this.touch()
  }

  static create(
    props: Optional<
      OrderProps,
      'createdAt' | 'updatedAt' | 'deliverymanId' | 'deliveryPhoto'
    >,
    id?: UniqueEntityID,
  ) {
    const order = new Order(
      {
        ...props,
        deliveryPhoto: props.deliveryPhoto ?? new OrderAttachmentList(),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    const isNewAnswer = !id

    if (isNewAnswer) {
      order.addDomainEvent(new OrderCreatedEvent(order))
    }

    return order
  }
}
