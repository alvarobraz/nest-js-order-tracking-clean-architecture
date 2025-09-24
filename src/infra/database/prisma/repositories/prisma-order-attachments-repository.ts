import { OrderAttachmentsRepository } from '@/domain/order-control/application/repositories/orders-attachments-repository'
import { OrderAttachment } from '@/domain/order-control/enterprise/entities/order-attachment'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { PrismaOrderAttachmentMapper } from '../mappers/prisma-order-attachment-mapper'

@Injectable()
export class PrismaOrderAttachmentsRepository
  implements OrderAttachmentsRepository
{
  constructor(private prisma: PrismaService) {}

  async findManyByOrderId(orderId: string): Promise<OrderAttachment[]> {
    const orderAttachments = await this.prisma.attachment.findMany({
      where: {
        orderId,
      },
    })

    return orderAttachments.map(PrismaOrderAttachmentMapper.toDomain)
  }

  async createMany(attachments: OrderAttachment[]): Promise<void> {
    if (attachments.length === 0) {
      return
    }

    const data = PrismaOrderAttachmentMapper.toPrismaUpdateMany(attachments)

    await this.prisma.attachment.updateMany(data)
  }

  async deleteMany(attachments: OrderAttachment[]): Promise<void> {
    if (attachments.length === 0) {
      return
    }

    const attachmentIds = attachments.map((attachment) => {
      return attachment.id.toString()
    })

    await this.prisma.attachment.deleteMany({
      where: {
        id: {
          in: attachmentIds,
        },
      },
    })
  }

  async deleteManyByOrderId(orderId: string): Promise<void> {
    await this.prisma.attachment.deleteMany({
      where: {
        orderId,
      },
    })
  }
}
