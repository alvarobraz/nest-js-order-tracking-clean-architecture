import { Either, left, right } from '@/core/either'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { User } from '@/domain/order-control/enterprise/entities/user'
import { OnlyActiveAdminsCanListDeliverymenError } from './errors/only-active-admins-can-list-deliverymen-error'
import { Injectable } from '@nestjs/common'
import { ActiveDeliverymanNotFoundError } from './errors/active-deliveryman-not-found-error'

interface DeliverymenByIdUseCaseRequest {
  adminId: string
  userId: string
}

type DeliverymenByIdUseCaseResponse = Either<
  OnlyActiveAdminsCanListDeliverymenError | ActiveDeliverymanNotFoundError,
  User
>

@Injectable()
export class DeliverymenByIdUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    adminId,
    userId,
  }: DeliverymenByIdUseCaseRequest): Promise<DeliverymenByIdUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)
    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return left(new OnlyActiveAdminsCanListDeliverymenError())
    }

    const deliverymen = await this.usersRepository.findById(userId)

    if (!deliverymen) {
      return left(new ActiveDeliverymanNotFoundError())
    }

    return right(deliverymen)
  }
}
