import { left, right, Either } from '@/core/either'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { InvalidCredentialsError } from './errors/invalid-credentials-error'
import { UserAccountIsInactiveError } from './errors/user-account-is-inactive-error'
import { HashComparer } from '../cryptography/hash-comparer'
import { Injectable } from '@nestjs/common'
import { Encrypter } from '../cryptography/encrypter'

interface LoginUserUseCaseRequest {
  cpf: string
  password: string
}

type LoginUserUseCaseResponse = Either<
  InvalidCredentialsError | UserAccountIsInactiveError,
  {
    accessToken: string
  }
>

@Injectable()
export class LoginUserUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashComparer: HashComparer,
    private encrypter: Encrypter,
  ) {}

  async execute({
    cpf,
    password,
  }: LoginUserUseCaseRequest): Promise<LoginUserUseCaseResponse> {
    const user = await this.usersRepository.findByCpf(cpf)

    if (!user) {
      return left(new InvalidCredentialsError())
    }

    const isPasswordValid = await this.hashComparer.compare(
      password,
      user.password,
    )

    if (!isPasswordValid) {
      return left(new InvalidCredentialsError())
    }

    if (user.status !== 'active') {
      return left(new UserAccountIsInactiveError())
    }

    const accessToken = await this.encrypter.encrypt({
      sub: user.id.toString(),
    })

    return right({
      accessToken,
    })
  }
}
