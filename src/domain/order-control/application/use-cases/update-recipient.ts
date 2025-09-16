import { Either, left, right } from '@/core/either'
import { RecipientsRepository } from '@/domain/order-control/application/repositories/recipients-repository'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { RecipientNotFoundError } from './errors/recipient-not-found-error'
import { Recipient } from '../../enterprise/entities/recipient'
import { OnlyActiveAdminsCanUpdateRecipientsError } from './errors/only-active-admins-can-update-recipients-error'
import { Injectable } from '@nestjs/common'

interface UpdateRecipientUseCaseRequest {
  adminId: string
  recipientId: string
  name?: string
  street?: string
  number?: number
  neighborhood?: string
  city?: string
  state?: string
  zipCode?: number
  phone?: string
  email?: string
  latitude?: number
  longitude?: number
}

type UpdateRecipientCaseResponse = Either<
  RecipientNotFoundError | OnlyActiveAdminsCanUpdateRecipientsError,
  {
    recipient: Recipient
  }
>

@Injectable()
export class UpdateRecipientUseCase {
  constructor(
    private recipientsRepository: RecipientsRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    adminId,
    recipientId,
    name,
    street,
    number,
    neighborhood,
    city,
    state,
    zipCode,
    phone,
    email,
  }: UpdateRecipientUseCaseRequest): Promise<UpdateRecipientCaseResponse> {
    console.log('adminId')
    console.log(adminId)

    const admin = await this.usersRepository.findById(adminId)
    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return left(new OnlyActiveAdminsCanUpdateRecipientsError())
    }

    const recipient = await this.recipientsRepository.findById(recipientId)
    if (!recipient) {
      return left(new RecipientNotFoundError())
    }

    if (name !== undefined) {
      recipient.name = name
    }
    if (street !== undefined) {
      recipient.street = street
    }
    if (number !== undefined) {
      recipient.number = number
    }
    if (neighborhood !== undefined) {
      recipient.neighborhood = neighborhood
    }
    if (city !== undefined) {
      recipient.city = city
    }
    if (state !== undefined) {
      recipient.state = state
    }
    if (zipCode !== undefined) {
      recipient.zipCode = zipCode
    }
    if (phone !== undefined) {
      recipient.phone = phone
    }
    if (email !== undefined) {
      recipient.email = email
    }

    await this.recipientsRepository.save(recipient)

    return right({ recipient })
  }
}
