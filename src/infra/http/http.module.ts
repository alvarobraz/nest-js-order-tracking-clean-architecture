import { Module } from '@nestjs/common'
import { AuthenticateController } from './controllers/authenticate.controller'
import { CreateAccountController } from './controllers/create-account.controller'
import { CreateOrderController } from './controllers/create-order.controller'
import { CreateRecipientController } from './controllers/create-recipient.controller'
import { DatabaseModule } from '../database/database.module'
import { CreateDeliverymanUseCase } from '@/domain/order-control/application/use-cases/create-deliveryman'
import { ListDeliverymenUseCase } from '@/domain/order-control/application/use-cases/list-deliverymen'
import { FetchRecentQuestionsController } from './controllers/list-deliveryman.controller'

@Module({
  imports: [DatabaseModule],
  controllers: [
    CreateAccountController,
    AuthenticateController,
    CreateOrderController,
    CreateRecipientController,
    FetchRecentQuestionsController,
  ],
  providers: [CreateDeliverymanUseCase, ListDeliverymenUseCase],
})
export class HttpModule {}
