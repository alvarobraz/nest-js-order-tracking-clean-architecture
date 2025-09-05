import { User } from '@/domain/order-control/enterprise/entities//user'

export interface UsersRepository {
  create(user: User): Promise<void>
  findById(id: string): Promise<User | null>
  findByCpf(cpf: string): Promise<User | null>
  save(user: User): Promise<User>
  patch(id: string, status: 'active' | 'inactive'): Promise<User>
  findAllDeliverymen(): Promise<User[]>
}
