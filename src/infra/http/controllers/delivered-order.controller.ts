import {
  Controller,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Param,
  Body,
  Put,
} from '@nestjs/common'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { DeliveredOrderUseCase } from '@/domain/order-control/application/use-cases/delivered-order'
import { OrderPresenter } from '../presenters/order-presenter'
import { OrderNotFoundError } from '@/domain/order-control/application/use-cases/errors/order-not-found-error'
import { OnlyActiveDeliverymenCanMarkOrdersAsDeliveredError } from '@/domain/order-control/application/use-cases/errors/only-active-deliverymen-can-mark-orders-as-delivered-error'
import { OnlyAssignedDeliverymanCanMarkOrderAsDeliveredError } from '@/domain/order-control/application/use-cases/errors/only-assigned-deliveryman-can-mark-order-as-delivered-error'
import { OrderMustBePickedUpToBeMarkedAsDeliveredError } from '@/domain/order-control/application/use-cases/errors/order-must-be-picked-up-to-be-marked-as-delivered-error'
import { DeliveryPhotoIsRequiredError } from '@/domain/order-control/application/use-cases/errors/delivery-photo-is-required-error'
import { z } from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipe'

const orderIdParamSchema = z.string().uuid()

const bodySchema = z.object({
  deliveryPhotoIds: z
    .array(z.string().uuid())
    .min(1, 'At least one delivery photo ID is required'),
})

const paramValidationPipe = new ZodValidationPipe(orderIdParamSchema)
const bodyValidationPipe = new ZodValidationPipe(bodySchema)

type OrderIdParamSchema = z.infer<typeof orderIdParamSchema>
type BodySchema = z.infer<typeof bodySchema>

@Controller('/order/delivered-order/:orderId')
@UseGuards(JwtAuthGuard)
export class DeliveredOrderUseCaseController {
  constructor(private deliveredOrderUseCase: DeliveredOrderUseCase) {}

  @Put()
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('orderId', paramValidationPipe) orderId: OrderIdParamSchema,
    @Body(bodyValidationPipe) body: BodySchema,
  ) {
    const { deliveryPhotoIds } = body

    const result = await this.deliveredOrderUseCase.execute({
      deliverymanId: user.sub,
      orderId,
      deliveryPhotoIds,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case OrderNotFoundError:
          throw new NotFoundException(error.message)
        case OnlyActiveDeliverymenCanMarkOrdersAsDeliveredError:
          throw new ForbiddenException(error.message)
        case OnlyAssignedDeliverymanCanMarkOrderAsDeliveredError:
          throw new ForbiddenException(error.message)
        case OrderMustBePickedUpToBeMarkedAsDeliveredError:
          throw new BadRequestException(error.message)
        case DeliveryPhotoIsRequiredError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException('An unexpected error occurred')
      }
    }

    const { order } = result.value
    return { order: OrderPresenter.toHTTP(order) }
  }
}
