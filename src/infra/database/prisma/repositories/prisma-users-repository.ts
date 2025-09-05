import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { User } from '@/domain/order-control/enterprise/entities/user'

export class PrismaUsersRepository implements UsersRepository {
  create(user: User): Promise<void> {
    throw new Error('Method not implemented.')
  }

  findById(id: string): Promise<User | null> {
    throw new Error('Method not implemented.')
  }

  findByCpf(cpf: string): Promise<User | null> {
    throw new Error('Method not implemented.')
  }

  save(user: User): Promise<User> {
    throw new Error('Method not implemented.')
  }

  patch(id: string, status: 'active' | 'inactive'): Promise<User> {
    throw new Error('Method not implemented.')
  }

  findAllDeliverymen(): Promise<User[]> {
    throw new Error('Method not implemented.')
  }
}
