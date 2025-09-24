import { Injectable } from '@nestjs/common'
import { OrderAttachment } from '../../enterprise/entities/order-attachment'

@Injectable()
export abstract class OrderAttachmentsRepository {
  abstract createMany(attachments: OrderAttachment[]): Promise<void>
  abstract deleteMany(attachments: OrderAttachment[]): Promise<void>

  abstract findManyByOrderId(orderId: string): Promise<OrderAttachment[]>
}
