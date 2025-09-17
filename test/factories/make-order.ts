import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Order,
  OrderProps,
} from '@/domain/order-control/enterprise/entities/order'
import { OrderAttachmentList } from '@/domain/order-control/enterprise/entities/order-attachment-list'

export function makeOrder(
  override: Partial<OrderProps> = {},
  id?: UniqueEntityID,
) {
  const order = Order.create(
    {
      recipientId: new UniqueEntityID(),
      status: 'pending',
      deliveryPhoto: new OrderAttachmentList() || [],
      createdAt: new Date(),
      ...override,
    },
    id,
  )

  return order
}
