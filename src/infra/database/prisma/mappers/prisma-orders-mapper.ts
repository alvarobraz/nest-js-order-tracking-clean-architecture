import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Order } from '@/domain/order-control/enterprise/entities/order'
import { OrderAttachmentList } from '@/domain/order-control/enterprise/entities/order-attachment-list'
import { Recipient } from '@/domain/order-control/enterprise/entities/recipient'
import {
  Order as PrismaOrder,
  Recipient as PrismaRecipient,
} from '@prisma/client'
import { PrismaRecipientMapper } from './prisma-recipients-mapper'

export class PrismaOrdersMapper {
  static toDomain(
    raw: PrismaOrder & { recipient?: PrismaRecipient | null },
  ): Order & { recipient?: Recipient } {
    const order = Order.create(
      {
        recipientId: new UniqueEntityID(raw.recipientId),
        deliverymanId: raw.deliverymanId
          ? new UniqueEntityID(raw.deliverymanId)
          : undefined,
        status: raw.status as
          | 'pending'
          | 'picked_up'
          | 'delivered'
          | 'returned',
        deliveryPhoto: new OrderAttachmentList(),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    )

    return Object.assign(order, {
      recipient: raw.recipient
        ? PrismaRecipientMapper.toDomain(raw.recipient)
        : undefined,
    })
  }

  static toPrisma(
    order: Order,
  ): Omit<PrismaOrder, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      recipientId: order.recipientId?.toString() ?? null,
      deliverymanId: order.deliverymanId?.toString() ?? null,
      status: order.status,
    }
  }
}
