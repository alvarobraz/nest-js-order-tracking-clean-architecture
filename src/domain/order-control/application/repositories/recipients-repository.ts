import { Recipient } from '@/domain/order-control/enterprise/entities//recipient'

export interface RecipientsRepository {
  create(recipient: Recipient): Promise<void>
  findById(id: string): Promise<Recipient | null>
  save(recipient: Recipient): Promise<Recipient>
  delete(id: string): Promise<void>
  findAll(): Promise<Recipient[]>
}
