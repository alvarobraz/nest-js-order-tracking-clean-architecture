import { PaginationParams } from '@/core/repositories/pagination-params'
import { User } from '@/domain/order-control/enterprise/entities//user'

export abstract class UsersRepository {
  abstract create(user: User): Promise<void>
  abstract findById(id: string): Promise<User | null>
  abstract findByCpf(cpf: string): Promise<User | null>
  abstract save(user: User): Promise<User>
  abstract patch(id: string, status: 'active' | 'inactive'): Promise<User>
  abstract findAllDeliverymen(params: PaginationParams): Promise<User[]>
}
