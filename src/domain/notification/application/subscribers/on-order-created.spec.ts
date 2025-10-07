import { OnOrderCreated } from '@/domain/notification/application/subscribers/on-order-created'
import { makeOrder } from 'test/factories/make-order'
import { InMemoryNotificationsRepository } from 'test/repositories/in-memory-notifications-repository'
import { InMemoryOrdersRepository } from 'test/repositories/in-memory-orders-repository'
import { InMemoryOrderAttachmentsRepository } from 'test/repositories/in-memory-order-attachments-repository'
import { InMemoryRecipientsRepository } from 'test/repositories/in-memory-recipients-repository'
import {
  SendNotificationUseCase,
  SendNotificationUseCaseRequest,
  SendNotificationUseCaseResponse,
} from '../use-cases/send-notification'
import { MockInstance, vi } from 'vitest'
import { waitFor } from 'test/utils/wait-for'
import { makeRecipient } from 'test/factories/make-recipient'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

describe('On Order Created', () => {
  let inMemoryOrdersRepository: InMemoryOrdersRepository
  let inMemoryNotificationsRepository: InMemoryNotificationsRepository
  let inMemoryOrderAttachmentsRepository: InMemoryOrderAttachmentsRepository
  let inMemoryRecipientsRepository: InMemoryRecipientsRepository
  let sendNotificationUseCase: SendNotificationUseCase
  let sendNotificationExecuteSpy: MockInstance<
    (
      args: SendNotificationUseCaseRequest,
    ) => Promise<SendNotificationUseCaseResponse>
  >

  beforeEach(() => {
    inMemoryOrderAttachmentsRepository =
      new InMemoryOrderAttachmentsRepository()
    inMemoryOrdersRepository = new InMemoryOrdersRepository(
      inMemoryOrderAttachmentsRepository,
    )
    inMemoryNotificationsRepository = new InMemoryNotificationsRepository()
    inMemoryRecipientsRepository = new InMemoryRecipientsRepository()
    sendNotificationUseCase = new SendNotificationUseCase(
      inMemoryNotificationsRepository,
    )

    sendNotificationExecuteSpy = vi.spyOn(sendNotificationUseCase, 'execute')

    new OnOrderCreated(inMemoryRecipientsRepository, sendNotificationUseCase)
  })

  it('should send a notification when an order is created', async () => {
    // Criar um destinatário com userId como string
    const userId = 'user-1' // Usar string em vez de UniqueEntityID
    const recipient = makeRecipient({
      userId,
    })
    await inMemoryRecipientsRepository.create(recipient)

    // Criar uma ordem com o recipientId correspondente
    const order = makeOrder({
      recipientId: recipient.id,
    })
    await inMemoryOrdersRepository.create(order)

    // Aguardar a execução do spy
    await waitFor(() => {
      expect(sendNotificationExecuteSpy).toHaveBeenCalled()
      expect(sendNotificationExecuteSpy).toHaveBeenCalledWith({
        recipientId: userId, // userId como string
        title: `Novo pedido criado "${order.id.toString()}"`,
        content: `O pedido com número "${order.id.toString()}" foi criado e está com status de "${order.status}"`,
      })
    })

    // Verificar se a notificação foi criada no repositório
    expect(inMemoryNotificationsRepository.items).toHaveLength(1)
    expect(inMemoryNotificationsRepository.items[0]).toMatchObject({
      recipientId: new UniqueEntityID(userId), // Convertido para UniqueEntityID na entidade Notification
      title: `Novo pedido criado "${order.id.toString()}"`,
      content: `O pedido com número "${order.id.toString()}" foi criado e está com status de "${order.status}"`,
    })
  })

  it('should not send a notification if recipient is not found', async () => {
    // Criar uma ordem com um recipientId que não existe
    const order = makeOrder({
      recipientId: new UniqueEntityID('non-existent-recipient'),
    })
    await inMemoryOrdersRepository.create(order)

    // Aguardar para garantir que o spy não foi chamado
    await waitFor(() => {
      expect(sendNotificationExecuteSpy).not.toHaveBeenCalled()
    })

    // Verificar que nenhuma notificação foi criada
    expect(inMemoryNotificationsRepository.items).toHaveLength(0)
  })

  it('should not send a notification if recipient has no userId', async () => {
    // Criar um destinatário sem userId
    const recipient = makeRecipient({
      userId: null,
    })
    await inMemoryRecipientsRepository.create(recipient)

    // Criar uma ordem com o recipientId
    const order = makeOrder({
      recipientId: recipient.id,
    })
    await inMemoryOrdersRepository.create(order)

    // Aguardar para garantir que o spy não foi chamado
    await waitFor(() => {
      expect(sendNotificationExecuteSpy).not.toHaveBeenCalled()
    })

    // Verificar que nenhuma notificação foi criada
    expect(inMemoryNotificationsRepository.items).toHaveLength(0)
  })
})
