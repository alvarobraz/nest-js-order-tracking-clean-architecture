import {
  Controller,
  Patch,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Param,
} from '@nestjs/common'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { PickUpOrderUseCase } from '@/domain/order-control/application/use-cases/pick-up-order'
import { OrderPresenter } from '../presenters/order-presenter'
import { OrderNotFoundError } from '@/domain/order-control/application/use-cases/errors/order-not-found-error'
import { OnlyActiveDeliverymenCanPickUpOrdersError } from '@/domain/order-control/application/use-cases/errors/only-active-deliverymen-can-pick-up-orders-error'
import { OrderMustBePendingToBePickedUpError } from '@/domain/order-control/application/use-cases/errors/order-must-be-pending-to-be-picked-up-error'
import { z } from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipe'

const orderIdParamSchema = z.string().uuid()

const paramValidationPipe = new ZodValidationPipe(orderIdParamSchema)

type OrderIdParamSchema = z.infer<typeof orderIdParamSchema>

@Controller('/order/pick-up/:orderId')
@UseGuards(JwtAuthGuard)
export class PickUpOrderController {
  constructor(private pickUpOrder: PickUpOrderUseCase) {}

  @Patch()
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('orderId', paramValidationPipe) orderId: OrderIdParamSchema,
  ) {
    const result = await this.pickUpOrder.execute({
      deliverymanId: user.sub,
      orderId,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case OrderNotFoundError:
          throw new NotFoundException(error.message)
        case OnlyActiveDeliverymenCanPickUpOrdersError:
          throw new ForbiddenException(error.message)
        case OrderMustBePendingToBePickedUpError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException('An unexpected error occurred')
      }
    }

    const { order } = result.value
    return { order: OrderPresenter.toHTTP(order) }
  }
}
