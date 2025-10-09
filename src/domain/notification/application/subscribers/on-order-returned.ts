import { DomainEvents } from '@/core/events/domain-events'
import { EventHandler } from '@/core/events/event-handler'
import { OrderReturnedEvent } from '@/domain/order-control/enterprise/events/order-returned-event'
import { SendNotificationUseCase } from '../use-cases/send-notification'
import { Injectable, Inject } from '@nestjs/common'
import { RecipientsRepository } from '@/domain/order-control/application/repositories/recipients-repository'

@Injectable()
export class OnOrderReturned implements EventHandler {
  constructor(
    @Inject('RecipientsRepository')
    private recipientsRepository: RecipientsRepository,
    @Inject(SendNotificationUseCase)
    private sendNotification: SendNotificationUseCase,
  ) {
    this.setupSubscriptions()
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      this.sendReturnedOrderNotification.bind(this),
      OrderReturnedEvent.name,
    )
  }

  private async sendReturnedOrderNotification({ order }: OrderReturnedEvent) {
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
          title: `Pedido com número "${order.id.toString()}" retornado`,
          content: `O pedido com número "${order.id.toString()}" foi retornado e está com status de "${order.status}"`,
        })
      } catch (error) {
        console.error('Error sending notification:', error)
      }
    }
  }
}
