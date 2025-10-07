import { Injectable } from '@nestjs/common'
import { Notification } from '../../enterprise/entities/notification'

@Injectable()
export abstract class NotificationsRepository {
  abstract findById(id: string): Promise<Notification | null>
  abstract create(notification: Notification): Promise<void>
  abstract save(notification: Notification): Promise<void>
}
