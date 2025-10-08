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
import { MarkOrderAsDeliveredUseCase } from '@/domain/order-control/application/use-cases/mark-order-as-delivered'
import { MarkOrderAsDeliveredController } from './controllers/mark-order-as-delivered.controller'
import { MarkOrderAsReturnedUseCase } from '@/domain/order-control/application/use-cases/mark-order-as-returned'
import { MarkOrderAsReturnedController } from './controllers/mark-order-as-returned.controller'
import { ListUserDeliveriesController } from './controllers/list-user-deliveries.controller'
import { ListUserDeliveriesUseCase } from '@/domain/order-control/application/use-cases/list-user-deliveries'
import { ListMyOrderController } from './controllers/list-my-order.controller'
import { ListMyOrderUseCase } from '@/domain/order-control/application/use-cases/list-my-order'
import { CreateUserRecipientController } from './controllers/create-user-recipient.controller'
import { CreateUserRecipientUseCase } from '@/domain/order-control/application/use-cases/create-user-recipient'
import { OnOrderCreated } from '@/domain/notification/application/subscribers/on-order-created'
import { SendNotificationUseCase } from '@/domain/notification/application/use-cases/send-notification'
import { PrismaNotificationsRepository } from '../database/prisma/repositories/prisma-notifications-repository'
import { OnOrderPickUp } from '@/domain/notification/application/subscribers/or-order-picked-up'

@Module({
  imports: [DatabaseModule, CryptographyModule, StorageModule],
  controllers: [
    CreateAccountController,
    CreateUserRecipientController,
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
    MarkOrderAsDeliveredController,
    MarkOrderAsReturnedController,
    ListUserDeliveriesController,
    ListMyOrderController,
  ],
  providers: [
    CreateDeliverymanUseCase,
    CreateUserRecipientUseCase,
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
    MarkOrderAsDeliveredUseCase,
    MarkOrderAsReturnedUseCase,
    ListUserDeliveriesUseCase,
    ListMyOrderUseCase,
    OnOrderCreated,
    OnOrderPickUp,
    SendNotificationUseCase,
    {
      provide: 'NotificationsRepository',
      useClass: PrismaNotificationsRepository,
    },
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
