import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ValueObject } from '@/core/entities/value-object'
import { Attachment } from '../attachment'

export interface OrderDetailsProps {
  recipientId: UniqueEntityID
  deliverymanId: UniqueEntityID
  status: string
  deliveryPhoto: Attachment[]
  createdAt: Date
  updatedAt?: Date | null
}

export class OrderDetails extends ValueObject<OrderDetailsProps> {
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

  static create(props: OrderDetailsProps) {
    return new OrderDetails(props)
  }
}
