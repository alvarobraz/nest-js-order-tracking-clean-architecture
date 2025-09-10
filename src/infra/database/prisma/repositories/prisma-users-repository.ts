import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { User } from '@/domain/order-control/enterprise/entities/user'
import { PrismaService } from '../prisma.service'
import { PrismaUserMapper } from '../mappers/prisma-users-mapper'
import { PaginationParams } from '@/core/repositories/pagination-params'
import { Injectable } from '@nestjs/common'

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private prisma: PrismaService) {}

  async create(user: User): Promise<void> {
    const data = PrismaUserMapper.toPrisma(user)

    await this.prisma.user.create({
      data,
    })
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    })

    if (!user) {
      return null
    }

    return PrismaUserMapper.toDomain(user)
  }

  async findByCpf(cpf: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        cpf,
      },
    })

    if (!user) {
      return null
    }

    return PrismaUserMapper.toDomain(user)
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
      },
    })

    if (!user) {
      return null
    }

    return PrismaUserMapper.toDomain(user)
  }

  async save(user: User): Promise<User> {
    const data = PrismaUserMapper.toPrisma(user)

    await this.prisma.user.update({
      where: {
        id: user.id.toString(),
      },
      data,
    })

    return PrismaUserMapper.toDomain(data)
  }

  async patch(id: string, status: 'active' | 'inactive'): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { status },
    })

    return PrismaUserMapper.toDomain(user)
  }

  async findAllDeliverymen({ page }: PaginationParams): Promise<User[]> {
    const user = await this.prisma.user.findMany({
      where: {
        role: 'deliveryman',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      skip: (page - 1) * 20,
    })

    return user.map(PrismaUserMapper.toDomain)
  }
}
