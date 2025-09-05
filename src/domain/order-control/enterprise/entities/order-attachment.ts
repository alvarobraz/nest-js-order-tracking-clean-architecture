import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

interface OrderAttachmentProps {
  orderId: UniqueEntityID
  attachmentId: UniqueEntityID
}

export class OrderAttachment extends Entity<OrderAttachmentProps> {
  get orderId() {
    return this.props.orderId
  }

  get attachmentId() {
    return this.props.attachmentId
  }

  static create(props: OrderAttachmentProps, id?: UniqueEntityID) {
    const orderAttachment = new OrderAttachment(props, id)

    return orderAttachment
  }
}
