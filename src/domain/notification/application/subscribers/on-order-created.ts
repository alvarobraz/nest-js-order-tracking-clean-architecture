import { DomainEvents } from '@/core/events/domain-events'
import { EventHandler } from '@/core/events/event-handler'
import { OrderCreatedEvent } from '@/domain/order-control/enterprise/events/order-created-event'
import { SendNotificationUseCase } from '../use-cases/send-notification'
import { Injectable, Inject } from '@nestjs/common'
import { RecipientsRepository } from '@/domain/order-control/application/repositories/recipients-repository'

@Injectable()
export class OnOrderCreated implements EventHandler {
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
      this.sendNewOrderNotification.bind(this),
      OrderCreatedEvent.name,
    )
  }

  private async sendNewOrderNotification({ order }: OrderCreatedEvent) {
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
          title: `Novo pedido criado "${order.id.toString()}"`,
          content: `O pedido com número "${order.id.toString()}" foi criado e está com status de "${order.status}"`,
        })
      } catch (error) {
        console.error('Error sending notification:', error)
      }
    }
  }
}
