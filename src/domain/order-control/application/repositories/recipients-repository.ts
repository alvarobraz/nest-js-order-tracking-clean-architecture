import { PaginationParams } from '@/core/repositories/pagination-params'
import { Recipient } from '@/domain/order-control/enterprise/entities//recipient'
import { Injectable } from '@nestjs/common'

@Injectable()
export abstract class RecipientsRepository {
  abstract create(recipient: Recipient): Promise<void>
  abstract findById(id: string): Promise<Recipient | null>
  abstract findByEmail(email: string): Promise<Recipient | null>
  abstract save(recipient: Recipient): Promise<Recipient>
  abstract delete(id: string): Promise<void>
  abstract findAll(params: PaginationParams): Promise<Recipient[]>
}
