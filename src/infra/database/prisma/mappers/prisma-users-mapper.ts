import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { User } from '@/domain/order-control/enterprise/entities/user'
import { User as PrismaUser } from '@prisma/client'

export class PrismaUserMapper {
  static toDomain(raw: PrismaUser): User {
    return User.create(
      {
        cpf: raw.cpf,
        password: raw.password,
        role: raw.role,
        name: raw.name,
        email: raw.email,
        phone: raw.phone,
        status: raw.status,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(user: User): PrismaUser {
    return {
      id: user.id.toString(),
      cpf: user.cpf,
      password: user.password,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt ?? null,
    }
  }
}
