import { AttachmentsRepository } from '@/domain/order-control/application/repositories/attachments-repository'
import { Attachment } from '@/domain/order-control/enterprise/entities/attachment'

export class InMemoryAttachmentsRepository implements AttachmentsRepository {
  public items: Attachment[] = []

  async create(attachment: Attachment) {
    this.items.push(attachment)
  }
}
