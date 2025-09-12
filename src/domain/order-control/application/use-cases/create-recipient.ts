import { Recipient } from '@/domain/order-control/enterprise/entities/recipient'
import { RecipientsRepository } from '@/domain/order-control/application/repositories/recipients-repository'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { Either, left, right } from '@/core/either'
import { OnlyActiveAdminsCanCreateRecipientsError } from './errors/only-active-admins-can-create-recipients-error'
import { Injectable } from '@nestjs/common'
import { RecipientAlreadyExistsError } from './errors/recipient-already-exists'

interface CreateRecipientUseCaseRequest {
  adminId: string
  name: string
  street: string
  number: number
  neighborhood: string
  city: string
  state: string
  zipCode: number
  phone: string
  email: string
}

type CreateRecipientUseCaseResponse = Either<
  OnlyActiveAdminsCanCreateRecipientsError | RecipientAlreadyExistsError,
  {
    recipient: Recipient
  }
>
@Injectable()
export class CreateRecipientUseCase {
  constructor(
    private recipientsRepository: RecipientsRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    adminId,
    name,
    street,
    number,
    neighborhood,
    city,
    state,
    zipCode,
    phone,
    email,
  }: CreateRecipientUseCaseRequest): Promise<CreateRecipientUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)
    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return left(new OnlyActiveAdminsCanCreateRecipientsError())
    }

    const userRecipient = await this.recipientsRepository.findByEmail(email)

    if (userRecipient) {
      return left(new RecipientAlreadyExistsError())
    }

    const recipient = Recipient.create({
      name,
      street,
      number,
      neighborhood,
      city,
      state,
      zipCode,
      phone,
      email,
    })

    await this.recipientsRepository.create(recipient)
    return right({ recipient })
  }
}
