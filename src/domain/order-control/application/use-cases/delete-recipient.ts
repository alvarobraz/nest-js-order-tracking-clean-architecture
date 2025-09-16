import { Either, left, right } from '@/core/either'
import { RecipientsRepository } from '@/domain/order-control/application/repositories/recipients-repository'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { OnlyActiveAdminsCanDeleteRecipientsError } from './errors/only-active-admins-can-delete-recipients-error'
import { RecipientNotFoundError } from './errors/recipient-not-found-error'
import { Injectable } from '@nestjs/common'

interface DeleteRecipientUseCaseRequest {
  adminId: string
  recipientId: string
}

type DeleteRecipientUseCaseUseCaseResponse = Either<
  OnlyActiveAdminsCanDeleteRecipientsError | RecipientNotFoundError,
  null
>

@Injectable()
export class DeleteRecipientUseCase {
  constructor(
    private recipientsRepository: RecipientsRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    adminId,
    recipientId,
  }: DeleteRecipientUseCaseRequest): Promise<DeleteRecipientUseCaseUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)
    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return left(new OnlyActiveAdminsCanDeleteRecipientsError())
    }

    const recipient = await this.recipientsRepository.findById(recipientId)
    if (!recipient) {
      return left(new RecipientNotFoundError())
    }

    await this.recipientsRepository.delete(recipientId)

    return right(null)
  }
}
