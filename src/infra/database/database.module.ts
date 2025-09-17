import { Module } from '@nestjs/common'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { PrismaUsersRepository } from '@/infra/database/prisma/repositories/prisma-users-repository'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { RecipientsRepository } from '@/domain/order-control/application/repositories/recipients-repository'
import { PrismaRecipientsRepository } from './prisma/repositories/prisma-recipients-repository'
import { OrdersRepository } from '@/domain/order-control/application/repositories/orders-repository'
import { PrismaOrdersRepository } from './prisma/repositories/prisma-orders-repository'

@Module({
  providers: [
    PrismaService,
    {
      provide: UsersRepository,
      useClass: PrismaUsersRepository,
    },
    {
      provide: OrdersRepository,
      useClass: PrismaOrdersRepository,
    },
    {
      provide: RecipientsRepository,
      useClass: PrismaRecipientsRepository,
    },
  ],
  exports: [
    PrismaService,
    UsersRepository,
    OrdersRepository,
    RecipientsRepository,
  ],
})
export class DatabaseModule {}
