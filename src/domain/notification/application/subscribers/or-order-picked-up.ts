import { DomainEvents } from '@/core/events/domain-events'
import { EventHandler } from '@/core/events/event-handler'
import { OrdersRepository } from '@/domain/order-control/application/repositories/orders-repository'
import { OrderPickedUpEvent } from '@/domain/order-control/enterprise/events/order-picked-up-event'
import { SendNotificationUseCase } from '../use-cases/send-notification'

export class OnOrderPickUp implements EventHandler {
  constructor(
    private ordersRepository: OrdersRepository,
    private sendNotification: SendNotificationUseCase,
  ) {
    this.setupSubscriptions()
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.sendPickUpOrderNotification.bind(this),
      OrderPickedUpEvent.name,
    )
  }

  private async sendPickUpOrderNotification({ order }: OrderPickedUpEvent) {
    const orderCreated = await this.ordersRepository.findById(
      order.id.toString(),
    )

    if (orderCreated && orderCreated.recipientId) {
      await this.sendNotification.execute({
        recipientId: orderCreated.recipientId.toString(),
        title: `Pedido "${orderCreated.recipientId.toString()}" retirado`,
        content: `O pedido com destinatário "${orderCreated.recipientId.toString()}" foi retirado e está com status "${orderCreated.status}"`,
      })
    }
  }
}
