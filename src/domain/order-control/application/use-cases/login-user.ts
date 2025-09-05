import { left, right, Either } from '@/core/either'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { InvalidCredentialsError } from './errors/invalid-credentials-error'
import { UserAccountIsInactiveError } from './errors/user-account-is-inactive-error'

interface LoginUserUseCaseRequest {
  cpf: string
  password: string
}

interface LoginUserUseCaseResponse {
  userId: string
  role: 'admin' | 'deliveryman'
}

export class LoginUserUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    cpf,
    password,
  }: LoginUserUseCaseRequest): Promise<
    Either<
      InvalidCredentialsError | UserAccountIsInactiveError,
      LoginUserUseCaseResponse
    >
  > {
    const user = await this.usersRepository.findByCpf(cpf)

    if (!user || user.password !== password) {
      return left(new InvalidCredentialsError())
    }

    if (user.status !== 'active') {
      return left(new UserAccountIsInactiveError())
    }

    return right({
      userId: user.id.toString(),
      role: user.role,
    })
  }
}
