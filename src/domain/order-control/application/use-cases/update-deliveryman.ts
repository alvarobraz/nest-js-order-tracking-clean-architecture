import { Either, left, right } from '@/core/either'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { ActiveDeliverymanNotFoundError } from './errors/active-deliveryman-not-found-error'
import { OnlyActiveAdminsCanUpdateDeliverymenError } from './errors/only-active-admins-can-update-deliverymen-error'
import { User } from '../../enterprise/entities/user'

interface UpdateDeliverymanUseCaseRequest {
  adminId: string
  deliverymanId: string
  name?: string
  email?: string
  phone?: string
}

type UpdateDeliverymanUseCaseResponse = Either<
  OnlyActiveAdminsCanUpdateDeliverymenError,
  {
    deliveryman: User
  }
>

export class UpdateDeliverymanUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    adminId,
    deliverymanId,
    name,
    email,
    phone,
  }: UpdateDeliverymanUseCaseRequest): Promise<UpdateDeliverymanUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)
    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return left(new OnlyActiveAdminsCanUpdateDeliverymenError())
    }

    const deliveryman = await this.usersRepository.findById(deliverymanId)
    if (
      !deliveryman ||
      deliveryman.role !== 'deliveryman' ||
      deliveryman.status !== 'active'
    ) {
      return left(new ActiveDeliverymanNotFoundError())
    }

    if (name !== undefined) {
      deliveryman.name = name
    }
    if (email !== undefined) {
      deliveryman.email = email
    }
    if (phone !== undefined) {
      deliveryman.phone = phone
    }

    await this.usersRepository.save(deliveryman)

    return right({
      deliveryman,
    })
  }
}
