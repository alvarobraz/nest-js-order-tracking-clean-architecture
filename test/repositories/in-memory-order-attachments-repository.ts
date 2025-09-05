import { OrderAttachment } from '@/domain/order-control/enterprise/entities/order-attachment'
import { OrderAttachmentsRepository } from '@/domain/order-control/application/repositories/orders-attachments-repository'

export class InMemoryOrderAttachmentsRepository
  implements OrderAttachmentsRepository
{
  public items: OrderAttachment[] = []

  async findManyByOrderId(orderId: string): Promise<OrderAttachment[]> {
    return this.items.filter((item) => item.orderId.toString() === orderId)
  }
}
