import { ConflictException, Injectable } from '@nestjs/common'
import { User } from '@/domain/order-control/enterprise/entities/user'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { Either, left, right } from '@/core/either'
import { HashGenerator } from '../cryptography/hash-generator'

interface CreateUserRecipientUseCaseRequest {
  name: string
  cpf: string
  password: string
  email: string
  phone: string
}

type CreateUserRecipientUseCaseResponse = Either<
  ConflictException,
  {
    user: User
  }
>

@Injectable()
export class CreateUserRecipientUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    name,
    cpf,
    password,
    email,
    phone,
  }: CreateUserRecipientUseCaseRequest): Promise<CreateUserRecipientUseCaseResponse> {
    const userWithSameCpf = await this.usersRepository.findByCpf(cpf)

    if (userWithSameCpf) {
      console.log('CPF conflict detected, returning Left:', cpf)
      return left(
        new ConflictException('User with same cpf address already exists.'),
      )
    }

    const userWithSameEmail = await this.usersRepository.findByEmail(email)

    if (userWithSameEmail) {
      console.log('Email conflict detected, returning Left:', email)
      return left(
        new ConflictException('User with same email address already exists.'),
      )
    }

    const hashedPassword = await this.hashGenerator.hash(password)

    const user = User.create({
      name,
      cpf,
      password: hashedPassword,
      role: 'recipient',
      email,
      phone,
      status: 'active',
    })

    await this.usersRepository.create(user)

    return right({ user })
  }
}
