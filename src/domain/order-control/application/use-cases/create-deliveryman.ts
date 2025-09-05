import { User } from '@/domain/order-control/enterprise/entities/user'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { Either, left, right } from '@/core/either'
import { OnlyActiveAdminsCanCreateDeliverymenError } from './errors/only-active-admins-can-create-deliverymen-error'

interface CreateDeliverymanUseCaseRequest {
  adminId: string
  name: string
  cpf: string
  password: string
  email: string
  phone: string
}

type CreateDeliverymanUseCaseResponse = Either<
  OnlyActiveAdminsCanCreateDeliverymenError,
  User
>

export class CreateDeliverymanUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    adminId,
    name,
    cpf,
    password,
    email,
    phone,
  }: CreateDeliverymanUseCaseRequest): Promise<CreateDeliverymanUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)
    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return left(new OnlyActiveAdminsCanCreateDeliverymenError())
    }

    const user = User.create({
      name,
      cpf,
      password,
      role: 'deliveryman',
      email,
      phone,
      status: 'active',
    })

    await this.usersRepository.create(user)

    return right(user)
  }
}
