import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { CreateAccountController } from '@/controllers/create-account.controller'
import { ConfigModule } from '@nestjs/config'
import { envSchema } from '@/env'
import { AuthModule } from '@/auth/auth.module'
import { AuthenticateController } from '@/controllers/authenticate.controller'
import { CreateOrderController } from '@/controllers/create-order.controller'
import { CreateRecipientController } from '@/controllers/create-recipient.controller'

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    AuthModule,
  ],
  controllers: [
    CreateAccountController,
    AuthenticateController,
    CreateOrderController,
    CreateRecipientController,
  ],
  providers: [PrismaService],
})
export class AppModule {}
