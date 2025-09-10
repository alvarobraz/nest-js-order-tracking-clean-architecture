import { ConflictException, Injectable } from '@nestjs/common'
import { User } from '@/domain/order-control/enterprise/entities/user'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { Either, left, right } from '@/core/either'
import { OnlyActiveAdminsCanCreateDeliverymenError } from './errors/only-active-admins-can-create-deliverymen-error'
import { HashGenerator } from '../cryptography/hash-generator'

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
  {
    user: User
  }
>

@Injectable()
export class CreateDeliverymanUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashGenerator: HashGenerator,
  ) {}

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

    const userIsNotAdmin = await this.usersRepository.findById(adminId)

    if (userIsNotAdmin?.role !== 'admin') {
      return left(new ConflictException('User is not admin.'))
    }

    const userWithSameCpf = await this.usersRepository.findByCpf(cpf)

    if (userWithSameCpf) {
      return left(
        new ConflictException('User with same cpf address already exists.'),
      )
    }

    const userWithSameEmail = await this.usersRepository.findByEmail(email)

    if (userWithSameEmail) {
      return left(
        new ConflictException('User with same email address already exists.'),
      )
    }

    const hashedPassword = await this.hashGenerator.hash(password)

    const user = User.create({
      name,
      cpf,
      password: hashedPassword,
      role: 'deliveryman',
      email,
      phone,
      status: 'active',
    })

    await this.usersRepository.create(user)

    return right({ user })
  }
}
