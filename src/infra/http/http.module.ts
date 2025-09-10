import { Module } from '@nestjs/common'
import { AuthenticateController } from './controllers/authenticate.controller'
import { CreateAccountController } from './controllers/create-account.controller'
import { CreateOrderController } from './controllers/create-order.controller'
import { CreateRecipientController } from './controllers/create-recipient.controller'
import { DatabaseModule } from '../database/database.module'
import { CreateDeliverymanUseCase } from '@/domain/order-control/application/use-cases/create-deliveryman'
import { ListDeliverymenUseCase } from '@/domain/order-control/application/use-cases/list-deliverymen'
import { FetchRecentQuestionsController } from './controllers/list-deliveryman.controller'
import { LoginUserUseCase } from '@/domain/order-control/application/use-cases/login-user'
import { CryptographyModule } from '../cryptography/cryptography.module'

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [
    CreateAccountController,
    AuthenticateController,
    CreateOrderController,
    CreateRecipientController,
    FetchRecentQuestionsController,
  ],
  providers: [
    CreateDeliverymanUseCase,
    ListDeliverymenUseCase,
    LoginUserUseCase,
  ],
})
export class HttpModule {}
