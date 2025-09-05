import { Recipient } from '@/domain/order-control/enterprise/entities/recipient'
import { RecipientsRepository } from '@/domain/order-control/application/repositories/recipients-repository'

export class InMemoryRecipientsRepository implements RecipientsRepository {
  public items: Recipient[] = []

  async create(recipient: Recipient): Promise<void> {
    this.items.push(recipient)
  }

  async findById(id: string): Promise<Recipient | null> {
    const recipient = this.items.find((item) => item.id.toString() === id)
    return recipient || null
  }

  async save(recipient: Recipient): Promise<Recipient> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === recipient.id.toString(),
    )
    if (index >= 0) {
      this.items[index] = recipient
    }
    return recipient
  }

  async delete(id: string): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === id)
    if (index >= 0) {
      this.items.splice(index, 1)
    }
  }

  async findAll(): Promise<Recipient[]> {
    return this.items
  }
}
