import { OrderAttachment } from '../../enterprise/entities/order-attachment'

export interface OrderAttachmentsRepository {
  findManyByOrderId(orderId: string): Promise<OrderAttachment[]>
}
