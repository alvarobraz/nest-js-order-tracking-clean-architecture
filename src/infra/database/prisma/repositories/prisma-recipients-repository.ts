import { Recipient } from '@/domain/order-control/enterprise/entities/recipient'
import { PrismaService } from '../prisma.service'
import { PrismaRecipientMapper } from '../mappers/prisma-recipients-mapper'
import { PaginationParams } from '@/core/repositories/pagination-params'
import { Injectable } from '@nestjs/common'
import { RecipientsRepository } from '@/domain/order-control/application/repositories/recipients-repository'

@Injectable()
export class PrismaRecipientsRepository implements RecipientsRepository {
  constructor(private prisma: PrismaService) {}

  async create(recipient: Recipient): Promise<void> {
    const data = PrismaRecipientMapper.toPrisma(recipient)

    await this.prisma.recipient.create({
      data,
    })
  }

  async findById(id: string): Promise<Recipient | null> {
    const recipient = await this.prisma.recipient.findUnique({
      where: {
        id,
      },
    })

    if (!recipient) {
      return null
    }

    return PrismaRecipientMapper.toDomain(recipient)
  }

  async findByEmail(email: string): Promise<Recipient | null> {
    const recipient = await this.prisma.recipient.findFirst({
      where: {
        email,
      },
    })

    if (!recipient) {
      return null
    }

    return PrismaRecipientMapper.toDomain(recipient)
  }

  async save(recipient: Recipient): Promise<Recipient> {
    const data = PrismaRecipientMapper.toPrisma(recipient)

    await this.prisma.recipient.update({
      where: {
        id: recipient.id.toString(),
      },
      data,
    })

    return PrismaRecipientMapper.toDomain(data)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.recipient.delete({
      where: {
        id,
      },
    })
  }

  async findAll({ page }: PaginationParams): Promise<Recipient[]> {
    const recipient = await this.prisma.recipient.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      skip: (page - 1) * 20,
    })

    return recipient.map(PrismaRecipientMapper.toDomain)
  }
}
