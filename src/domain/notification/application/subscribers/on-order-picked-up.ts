import { DomainEvents } from '@/core/events/domain-events'
import { EventHandler } from '@/core/events/event-handler'
import { OrdersRepository } from '@/domain/order-control/application/repositories/orders-repository'
import { OrderPickedUpEvent } from '@/domain/order-control/enterprise/events/order-picked-up-event'
import { SendNotificationUseCase } from '../use-cases/send-notification'
import { Inject } from '@nestjs/common'
import { RecipientsRepository } from '@/domain/order-control/application/repositories/recipients-repository'

export class OnOrderPickUp implements EventHandler {
  constructor(
    @Inject('OrdersRepository')
    private ordersRepository: OrdersRepository,
    @Inject('RecipientsRepository')
    private recipientsRepository: RecipientsRepository,
    @Inject(SendNotificationUseCase)
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
    if (order.recipientId) {
      const recipient = await this.recipientsRepository.findById(
        order.recipientId.toString(),
      )

      if (!recipient || !recipient.userId) {
        console.error(
          `Recipient or userId not found for recipientId ${order.recipientId.toString()}`,
        )
        return
      }

      try {
        await this.sendNotification.execute({
          recipientId: recipient.userId.toString(),
          title: `Pedido "${order.id.toString()}" retirado`,
          content: `O pedido com destinatário "${recipient.userId.toString()}" foi retirado e está com status "${order.status}"`,
        })
      } catch (error) {
        console.error('Error sending notification:', error)
      }
    }
  }
}
