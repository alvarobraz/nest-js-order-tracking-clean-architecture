import { Order } from '@/domain/order-control/enterprise/entities/order'
import { Recipient } from '@/domain/order-control/enterprise/entities/recipient'

export class OrderPresenter {
  static toHTTP(order: Order & { recipient?: Recipient }) {
    return {
      id: order.id.toString(),
      recipientId: order.recipientId?.toString(),
      recipient: order.recipient
        ? {
            id: order.recipient.id.toString(),
            name: order.recipient.name,
            email: order.recipient.email,
            phone: order.recipient.phone,
            street: order.recipient.street,
            number: order.recipient.number,
            neighborhood: order.recipient.neighborhood,
            city: order.recipient.city,
            state: order.recipient.state,
            zipCode: order.recipient.zipCode,
          }
        : null,
      deliverymanId: order.deliverymanId?.toString(),
      status: order.status,
      deliveryPhoto: order.deliveryPhoto.currentItems.map((attachment) => ({
        id: attachment.attachmentId.toString(),
        orderId: attachment.orderId.toString(),
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }
  }
}
