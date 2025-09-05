import { Recipient } from '@/domain/order-control/enterprise/entities/recipient'
import { RecipientsRepository } from '@/domain/order-control/application/repositories/recipients-repository'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { Either, left, right } from '@/core/either'
import { OnlyActiveAdminsCanCreateRecipientsError } from './errors/only-active-admins-can-create-recipients-error'

interface CreateRecipientUseCaseRequest {
  adminId: string
  name: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  phone: string
  email: string
}

type CreateRecipientUseCaseResponse = Either<
  OnlyActiveAdminsCanCreateRecipientsError,
  {
    recipient: Recipient
  }
>

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
