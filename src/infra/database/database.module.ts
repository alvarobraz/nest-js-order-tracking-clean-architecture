import { Module } from '@nestjs/common'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { PrismaUsersRepository } from '@/infra/database/prisma/repositories/prisma-users-repository'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { RecipientsRepository } from '@/domain/order-control/application/repositories/recipients-repository'
import { PrismaRecipientsRepository } from './prisma/repositories/prisma-recipients-repository'

@Module({
  providers: [
    PrismaService,
    {
      provide: UsersRepository,
      useClass: PrismaUsersRepository,
    },
    {
      provide: RecipientsRepository,
      useClass: PrismaRecipientsRepository,
    },
  ],
  exports: [PrismaService, UsersRepository, RecipientsRepository],
})
export class DatabaseModule {}
