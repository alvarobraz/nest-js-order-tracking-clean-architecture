import { faker } from '@faker-js/faker/locale/pt_BR'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  User,
  UserProps,
} from '@/domain/order-control/enterprise/entities/user'

export function makeUser(
  override: Partial<UserProps> = {},
  id?: UniqueEntityID,
) {
  const user = User.create(
    {
      cpf: faker.number
        .int({ min: 10000000000, max: 99999999999 })
        .toString()
        .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
      password: 'password123',
      role: 'admin',
      name: faker.person.fullName(),
      status: 'active',
      ...override,
    },
    id,
  )

  return user
}
