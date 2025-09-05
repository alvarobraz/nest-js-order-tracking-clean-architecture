import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'

interface NotificationProps {
  orderId: UniqueEntityID
  message: string
  type: 'email' | 'system'
  createdAt: Date
}

export class Notification extends Entity<NotificationProps> {
  get orderId() {
    return this.props.orderId
  }

  get message() {
    return this.props.message
  }

  get type() {
    return this.props.type
  }

  get createdAt() {
    return this.props.createdAt
  }

  static create(
    props: Optional<NotificationProps, 'createdAt'>,
    id?: UniqueEntityID,
  ) {
    const notification = new Notification(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return notification
  }
}
