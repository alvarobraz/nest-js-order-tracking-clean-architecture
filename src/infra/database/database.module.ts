import { Module } from '@nestjs/common'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { PrismaUsersRepository } from '@/infra/database/prisma/repositories/prisma-users-repository'

@Module({
  providers: [PrismaService, PrismaUsersRepository],
  exports: [PrismaService, PrismaUsersRepository],
})
export class DatabaseModule {}
