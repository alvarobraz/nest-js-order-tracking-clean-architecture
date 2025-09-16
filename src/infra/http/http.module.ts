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
import { UpdateDeliverymanUseCase } from '@/domain/order-control/application/use-cases/update-deliveryman'
import { UpdateDeliverymanController } from './controllers/update.deliveryman.controller'
import { DeliverymenByIdUseCase } from '@/domain/order-control/application/use-cases/deliverymen-by-id'
import { DeliverymenByIdController } from './controllers/deliveryman-by-id.controller'
import { CreateRecipientUseCase } from '@/domain/order-control/application/use-cases/create-recipient'
import { RecipientByIdUseCase } from '@/domain/order-control/application/use-cases/recipient-by-id'
import { RecipientByIdController } from './controllers/recipient-by-id.controller'
import { ListRecipientsUseCase } from '@/domain/order-control/application/use-cases/list-recipients'
import { ListRecipientsController } from './controllers/list-recipients.controller'
import { UpdateRecipientUseCase } from '@/domain/order-control/application/use-cases/update-recipient'
import { UpdateRecipientController } from './controllers/update-recipient.controller'
import { DeleteRecipientUseCase } from '@/domain/order-control/application/use-cases/delete-recipient'
import { DeleteRecipientController } from './controllers/delete-recipient.controller'

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [
    CreateAccountController,
    AuthenticateController,
    CreateOrderController,
    CreateRecipientController,
    FetchRecentQuestionsController,
    UpdateDeliverymanController,
    DeliverymenByIdController,
    RecipientByIdController,
    ListRecipientsController,
    UpdateRecipientController,
    DeleteRecipientController,
  ],
  providers: [
    CreateDeliverymanUseCase,
    ListDeliverymenUseCase,
    LoginUserUseCase,
    UpdateDeliverymanUseCase,
    DeliverymenByIdUseCase,
    CreateRecipientUseCase,
    RecipientByIdUseCase,
    ListRecipientsUseCase,
    UpdateRecipientUseCase,
    DeleteRecipientUseCase,
  ],
})
export class HttpModule {}
