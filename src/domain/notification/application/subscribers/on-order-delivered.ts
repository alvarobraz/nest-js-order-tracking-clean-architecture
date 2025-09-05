import { DomainEvents } from '@/core/events/domain-events'
import { EventHandler } from '@/core/events/event-handler'
import { OrdersRepository } from '@/domain/order-control/application/repositories/orders-repository'
import { OrderDeliveredEvent } from '@/domain/order-control/enterprise/events/order-delivered-event'
import { SendNotificationUseCase } from '../use-cases/send-notification'

export class OnOrderDelivered implements EventHandler {
  constructor(
    private ordersRepository: OrdersRepository,
    private sendNotification: SendNotificationUseCase,
  ) {
    this.setupSubscriptions()
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.sendDeliveredOrderNotification.bind(this),
      OrderDeliveredEvent.name,
    )
  }

  private async sendDeliveredOrderNotification({ order }: OrderDeliveredEvent) {
    const orderDelivered = await this.ordersRepository.findById(
      order.id.toString(),
    )

    if (orderDelivered && orderDelivered.recipientId) {
      await this.sendNotification.execute({
        recipientId: orderDelivered.recipientId.toString(),
        title: `Pedido "${orderDelivered.recipientId.toString()}" entregue`,
        content: `O pedido com destinatário "${orderDelivered.recipientId.toString()}" foi entregue e está com status "${orderDelivered.status}"`,
      })
    }
  }
}
