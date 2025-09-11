import { Either, left, right } from '@/core/either'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { ActiveDeliverymanNotFoundError } from './errors/active-deliveryman-not-found-error'
import { OnlyActiveAdminsCanUpdateDeliverymenError } from './errors/only-active-admins-can-update-deliverymen-error'
import { User } from '../../enterprise/entities/user'
import { Injectable } from '@nestjs/common'
import { HashGenerator } from '../cryptography/hash-generator'

interface UpdateDeliverymanUseCaseRequest {
  adminId: string
  deliverymanId: string
  password?: string
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

@Injectable()
export class UpdateDeliverymanUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    adminId,
    deliverymanId,
    password,
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

    if (password !== undefined) {
      const hashedPassword = await this.hashGenerator.hash(password)
      deliveryman.password = hashedPassword
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
