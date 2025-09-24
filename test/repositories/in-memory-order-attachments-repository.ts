import { OrderAttachment } from '@/domain/order-control/enterprise/entities/order-attachment'
import { OrderAttachmentsRepository } from '@/domain/order-control/application/repositories/orders-attachments-repository'

export class InMemoryOrderAttachmentsRepository
  implements OrderAttachmentsRepository
{
  async createMany(attachments: OrderAttachment[]): Promise<void> {
    this.items.push(...attachments)
  }

  async deleteMany(attachments: OrderAttachment[]): Promise<void> {
    const questionAttachments = this.items.filter((item) => {
      return !attachments.some((attachment) => attachment.equals(item))
    })

    this.items = questionAttachments
  }

  public items: OrderAttachment[] = []

  async findManyByOrderId(orderId: string): Promise<OrderAttachment[]> {
    return this.items.filter((item) => item.orderId.toString() === orderId)
  }
}
