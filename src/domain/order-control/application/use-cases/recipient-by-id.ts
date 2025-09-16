import { Either, left, right } from '@/core/either'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { RecipientsRepository } from '@/domain/order-control/application/repositories/recipients-repository'
import { Recipient } from '@/domain/order-control/enterprise/entities/recipient'
import { OnlyActiveAdminsCanListRecipientsError } from './errors/only-active-admins-can-list-recipients-error'
import { Injectable } from '@nestjs/common'
import { RecipientNotFoundError } from './errors/recipient-not-found-error'

interface RecipientByIdUseCaseRequest {
  adminId: string
  recipientId: string
}

type RecipientByIdUseCaseResponse = Either<
  OnlyActiveAdminsCanListRecipientsError | RecipientNotFoundError,
  Recipient
>

@Injectable()
export class RecipientByIdUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private recipientsRepository: RecipientsRepository,
  ) {}

  async execute({
    adminId,
    recipientId,
  }: RecipientByIdUseCaseRequest): Promise<RecipientByIdUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)
    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return left(new OnlyActiveAdminsCanListRecipientsError())
    }

    const recipient = await this.recipientsRepository.findById(recipientId)

    if (!recipient) {
      return left(new RecipientNotFoundError())
    }

    return right(recipient)
  }
}
