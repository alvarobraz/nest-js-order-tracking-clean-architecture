import { Notification } from '@/domain/order-control/enterprise/entities//notification'

export interface NotificationsRepository {
  create(notification: Notification): Promise<void>
}
