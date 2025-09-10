import { User } from '@/domain/order-control/enterprise/entities/user'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'

export class InMemoryUsersRepository implements UsersRepository {
  public items: User[] = []

  async create(user: User): Promise<void> {
    this.items.push(user)
  }

  async findById(id: string): Promise<User | null> {
    const user = this.items.find((item) => item.id.toString() === id)
    return user || null
  }

  async findByCpf(cpf: string): Promise<User | null> {
    const user = this.items.find((item) => item.cpf === cpf)
    return user || null
  }

  async save(user: User): Promise<User> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === user.id.toString(),
    )
    if (index >= 0) {
      this.items[index] = user
    }
    return user
  }

  async patch(id: string, status: 'active' | 'inactive'): Promise<User> {
    const index = this.items.findIndex((item) => item.id.toString() === id)
    if (index === -1) {
      throw new Error('User not found')
    }
    const user = this.items[index]
    user.status = status
    this.items[index] = user
    return user
  }

  async findAllDeliverymen({ page }: { page: number }): Promise<User[]> {
    const perPage = 20
    const start = (page - 1) * perPage
    const end = start + perPage
    return this.items
      .filter((user) => user.role === 'deliveryman')
      .slice(start, end)
  }
}
