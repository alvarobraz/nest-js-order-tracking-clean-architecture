import { Either, left, right } from '@/core/either'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { User } from '@/domain/order-control/enterprise/entities/user'
import { OnlyActiveAdminsCanListDeliverymenError } from './errors/only-active-admins-can-list-deliverymen-error'

interface ListDeliverymenUseCaseRequest {
  page: number
  adminId: string
}

type ListDeliverymenUseCaseResponse = Either<
  OnlyActiveAdminsCanListDeliverymenError,
  User[]
>

export class ListDeliverymenUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    page,
    adminId,
  }: ListDeliverymenUseCaseRequest): Promise<ListDeliverymenUseCaseResponse> {
    const admin = await this.usersRepository.findById(adminId)
    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return left(new OnlyActiveAdminsCanListDeliverymenError())
    }

    const deliverymen = await this.usersRepository.findAllDeliverymen({ page })
    return right(deliverymen.filter((user) => user.status === 'active'))
  }
}
