import { DomainEvents } from '@/core/events/domain-events'
import { EventHandler } from '@/core/events/event-handler'
import { OrdersRepository } from '@/domain/order-control/application/repositories/orders-repository'
import { OrderCreatedEvent } from '@/domain/order-control/enterprise/events/order-created-event'
import { SendNotificationUseCase } from '../use-cases/send-notification'

export class OnOrderCreated implements EventHandler {
  constructor(
    private ordersRepository: OrdersRepository,
    private sendNotification: SendNotificationUseCase,
  ) {
    this.setupSubscriptions()
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.sendNewOrderNotification.bind(this),
      OrderCreatedEvent.name,
    )
  }

  private async sendNewOrderNotification({ order }: OrderCreatedEvent) {
    const orderCreated = await this.ordersRepository.findById(
      order.id.toString(),
    )

    if (orderCreated && orderCreated.recipientId) {
      await this.sendNotification.execute({
        recipientId: orderCreated.recipientId.toString(),
        title: `Novo pedido criado "${orderCreated.recipientId.toString()}"`,
        content: `O pedido com número "${orderCreated.recipientId.toString()}" foi criado e está com status de "${orderCreated.status}"`,
      })
    }
  }
}
