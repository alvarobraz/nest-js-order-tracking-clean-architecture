import { Recipient } from '@/domain/order-control/enterprise/entities/recipient'
import { RecipientsRepository } from '@/domain/order-control/application/repositories/recipients-repository'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { Either, left, right } from '@/core/either'
import { OnlyActiveAdminsCanListRecipientsError } from './errors/only-active-admins-can-list-recipients-error'

interface ListRecipientsUseCaseRequest {
  adminId: string
}

type ListRecipientsUseCaseResponse = Either<
  OnlyActiveAdminsCanListRecipientsError,
  Recipient[]
>

export class ListRecipientsUseCase {
  constructor(
    private recipientsRepository: RecipientsRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    adminId,
  }: ListRecipientsUseCaseRequest): Promise<ListRecipientsUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)
    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return left(new OnlyActiveAdminsCanListRecipientsError())
    }

    const listRecipients = await this.recipientsRepository.findAll()
    return right(listRecipients)
  }
}
