import { PaginationParams } from '@/core/repositories/pagination-params'
import { Order } from '@/domain/order-control/enterprise/entities/order'
import { Injectable } from '@nestjs/common'

@Injectable()
export abstract class OrdersRepository {
  abstract create(order: Order): Promise<Order>
  abstract findById(id: string): Promise<Order | null>
  abstract save(order: Order): Promise<Order | void>
  abstract delete(id: string): Promise<void>
  abstract findAll(params: PaginationParams): Promise<Order[]>
  abstract findNearby(neighborhood: string): Promise<Order[]>
  abstract findByDeliverymanId(deliverymanId: string): Promise<Order[]>
}
