import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Notification } from '@/domain/notification/enterprise/entities/notification'

export class PrismaNotificationMapper {
  static toDomain(raw: {
    id: string
    recipientId: string
    title: string
    content: string
    createdAt: Date
    readAt?: Date | null
  }): Notification {
    return Notification.create(
      {
        recipientId: new UniqueEntityID(raw.recipientId),
        title: raw.title,
        content: raw.content,
        createdAt: raw.createdAt,
        readAt: raw.readAt ?? undefined,
      },
      new UniqueEntityID(raw.id),
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static toPrisma(notification: Notification): any {
    return {
      id: notification.id.toString(),
      recipientId: notification.recipientId.toString(),
      title: notification.title,
      content: notification.content,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
    }
  }
}
