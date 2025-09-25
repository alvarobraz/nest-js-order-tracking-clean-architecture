import { Order } from '@/domain/order-control/enterprise/entities/order'
import { PrismaService } from '../prisma.service'
import { PrismaOrdersMapper } from '../mappers/prisma-orders-mapper'
import { PaginationParams } from '@/core/repositories/pagination-params'
import { Injectable } from '@nestjs/common'
import { OrdersRepository } from '@/domain/order-control/application/repositories/orders-repository'
import { Recipient } from '@/domain/order-control/enterprise/entities/recipient'
import { OrderAttachmentsRepository } from '@/domain/order-control/application/repositories/orders-attachments-repository'

@Injectable()
export class PrismaOrdersRepository implements OrdersRepository {
  constructor(
    private prisma: PrismaService,
    private orderAttachmentsRepository: OrderAttachmentsRepository,
  ) {}

  async create(orders: Order): Promise<void> {
    const data = PrismaOrdersMapper.toPrisma(orders)

    await this.prisma.order.create({
      data,
    })

    await this.orderAttachmentsRepository.createMany(
      orders.deliveryPhoto.getItems(),
    )
  }

  async findById(id: string): Promise<Order | null> {
    const orders = await this.prisma.order.findUnique({
      where: {
        id,
      },
      include: { recipient: true, attachments: true },
    })

    if (!orders) {
      return null
    }

    return PrismaOrdersMapper.toDomain(orders)
  }

  async save(order: Order): Promise<void> {
    const data = PrismaOrdersMapper.toPrisma(order)

    // const updatedOrder = await this.prisma.order.update({
    //   where: {
    //     id: order.id.toString(),
    //   },
    //   data,
    //   include: { attachments: true }, // Incluir anexos, se necessário
    // })

    // const domainOrder = PrismaOrdersMapper.toDomain(updatedOrder)
    // return domainOrder
    await Promise.all([
      this.prisma.order.update({
        where: {
          id: order.id.toString(),
        },
        data,
      }),
      this.orderAttachmentsRepository.createMany(
        order.deliveryPhoto.getNewItems(),
      ),
      this.orderAttachmentsRepository.deleteMany(
        order.deliveryPhoto.getRemovedItems(),
      ),
    ])
  }

  async delete(id: string): Promise<void> {
    await this.prisma.order.delete({
      where: {
        id,
      },
    })
  }

  async findAll({ page }: PaginationParams): Promise<Order[]> {
    const perPage = 20
    const skip = (page - 1) * perPage
    const orders = await this.prisma.order.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: perPage,
      skip,
      include: { recipient: true },
    })

    return orders.map(PrismaOrdersMapper.toDomain)
  }

  async findNearby(
    neighborhood: string,
  ): Promise<(Order & { recipient?: Recipient })[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        recipient: {
          neighborhood: {
            contains: neighborhood,
            mode: 'insensitive',
          },
        },
      },
      include: { recipient: true },
    })

    return orders.map(PrismaOrdersMapper.toDomain)
  }

  async findByDeliverymanId(deliverymanId: string): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        deliverymanId,
      },
      include: { recipient: true, attachments: true },
    })
    return orders.map(PrismaOrdersMapper.toDomain)
  }
}
