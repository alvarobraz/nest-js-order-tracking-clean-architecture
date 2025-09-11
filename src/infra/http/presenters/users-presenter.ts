import { User } from '@/domain/order-control/enterprise/entities/user'

export class UserPresenter {
  static toHTTP(user: User) {
    return {
      id: user.id.toString(),
      cpf: user.cpf,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
    }
  }
}
