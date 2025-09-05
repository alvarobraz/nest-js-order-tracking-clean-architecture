import { left } from '@/core/either'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { UserNotFoundError } from './errors/user-not-found-error'
import { OnlyActiveAdminsCanChangeUserPasswordsError } from './errors/only-active-admins-can-change-user-passwords-error'

interface ChangeUserPasswordUseCaseRequest {
  adminId: string
  userId: string
  newPassword: string
}

export class ChangeUserPasswordUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    adminId,
    userId,
    newPassword,
  }: ChangeUserPasswordUseCaseRequest) {
    const admin = await this.usersRepository.findById(adminId)
    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      return left(new OnlyActiveAdminsCanChangeUserPasswordsError())
    }

    const user = await this.usersRepository.findById(userId)
    if (!user) {
      return left(new UserNotFoundError())
    }

    user.password = newPassword

    await this.usersRepository.save(user)

    return user
  }
}
