import { Order } from '@/domain/order-control/enterprise/entities//order'

export interface OrdersRepository {
  create(order: Order): Promise<void>
  findById(id: string): Promise<Order | null>
  save(order: Order): Promise<Order>
  delete(id: string): Promise<void>
  findAll(): Promise<Order[]>
  findNearby(neighborhood: string): Promise<Order[]>
  findByDeliverymanId(deliverymanId: string): Promise<Order[]>
}
