import { Either, left, right } from '@/core/either'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { OnlyActiveAdminsCanDeactivateDeliverymenError } from './errors/only-active-admins-can-deactivate-deliverymen-error'
import { ActiveDeliverymanNotFoundError } from './errors/active-deliveryman-not-found-error'
import { User } from '../../enterprise/entities/user'

interface DeactivateDeliverymanUseCaseRequest {
  adminId: string
  deliverymanId: string
}

type CreateDeliverymanUseCaseResponse = Either<
  OnlyActiveAdminsCanDeactivateDeliverymenError,
  {
    deliveryman: User
  }
>

export class DeactivateDeliverymanUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    adminId,
    deliverymanId,
  }: DeactivateDeliverymanUseCaseRequest): Promise<CreateDeliverymanUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)
    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return left(new OnlyActiveAdminsCanDeactivateDeliverymenError())
    }

    const deliveryman = await this.usersRepository.findById(deliverymanId)
    if (
      !deliveryman ||
      deliveryman.role !== 'deliveryman' ||
      deliveryman.status !== 'active'
    ) {
      return left(new ActiveDeliverymanNotFoundError())
    }

    await this.usersRepository.patch(deliverymanId, 'inactive')

    return right({ deliveryman })
  }
}
