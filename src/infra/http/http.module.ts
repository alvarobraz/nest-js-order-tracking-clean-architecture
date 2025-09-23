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
import { ListOrdersUseCase } from '@/domain/order-control/application/use-cases/list-orders'
import { ListOrdersController } from './controllers/list-orders.controller'
import { CreateOrderUseCase } from '@/domain/order-control/application/use-cases/create-order'
// import { OrdersRepository } from '@/domain/order-control/application/repositories/orders-repository'
// import { RecipientsRepository } from '@/domain/order-control/application/repositories/recipients-repository'
import { PrismaOrdersRepository } from '../database/prisma/repositories/prisma-orders-repository'
import { PrismaRecipientsRepository } from '../database/prisma/repositories/prisma-recipients-repository'
import { OrderByIdUseCase } from '@/domain/order-control/application/use-cases/order-by-id'
import { OrderByIdController } from './controllers/order-by-id.controller'
import { DeleteOrderUseCase } from '@/domain/order-control/application/use-cases/delete-order'
import { DeleteOrderController } from './controllers/delete-order.controller'
import { ListNearbyOrdersUseCase } from '@/domain/order-control/application/use-cases/list-nearby-orders'
import { ListNearbyOrdersController } from './controllers/list-nearby-orders.controller'
import { PickUpOrderUseCase } from '@/domain/order-control/application/use-cases/pick-up-order'
import { PickUpOrderController } from './controllers/pick-up-order.controller'
import { UploadAttachmentController } from './controllers/upload-attachment.controller'
import { StorageModule } from '../storage/storage.module'
import { UploadAndCreateAttachmentUseCase } from '@/domain/order-control/application/use-cases/upload-and-create-attachment'

@Module({
  imports: [DatabaseModule, CryptographyModule, StorageModule],
  controllers: [
    CreateAccountController,
    AuthenticateController,
    CreateRecipientController,
    FetchRecentQuestionsController,
    UpdateDeliverymanController,
    DeliverymenByIdController,
    RecipientByIdController,
    ListRecipientsController,
    UpdateRecipientController,
    DeleteRecipientController,
    ListOrdersController,
    CreateOrderController,
    OrderByIdController,
    DeleteOrderController,
    ListNearbyOrdersController,
    PickUpOrderController,
    UploadAttachmentController,
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
    ListOrdersUseCase,
    CreateOrderUseCase,
    OrderByIdUseCase,
    DeleteOrderUseCase,
    ListNearbyOrdersUseCase,
    PickUpOrderUseCase,
    {
      provide: 'OrdersRepository',
      useClass: PrismaOrdersRepository,
    },
    {
      provide: 'RecipientsRepository',
      useClass: PrismaRecipientsRepository,
    },
    UploadAndCreateAttachmentUseCase,
  ],
  exports: [CreateOrderUseCase],
})
export class HttpModule {}
