import {
  Controller,
  Patch,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  Param,
} from '@nestjs/common'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { MarkOrderAsReturnedUseCase } from '@/domain/order-control/application/use-cases/mark-order-as-returned'
import { OrderPresenter } from '../presenters/order-presenter'
import { OnlyActiveUsersCanMarkOrdersAsReturnedError } from '@/domain/order-control/application/use-cases/errors/only-active-users-can-mark-orders-as-returned-error'
import { OnlyAssignedDeliverymanOrAdminCanMarkOrderAsReturnedError } from '@/domain/order-control/application/use-cases/errors/only-assigned-deliveryman-or-admin-can-mark-order-as-returned-error'
import { OrderNotFoundError } from '@/domain/order-control/application/use-cases/errors/order-not-found-error'
import { z } from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipe'

const orderIdParamSchema = z.string().uuid()
const paramValidationPipe = new ZodValidationPipe(orderIdParamSchema)
type OrderIdParamSchema = z.infer<typeof orderIdParamSchema>

@Controller('/order/mark-as-returned/:orderId')
@UseGuards(JwtAuthGuard)
export class MarkOrderAsReturnedController {
  constructor(private markOrderAsReturned: MarkOrderAsReturnedUseCase) {}

  @Patch()
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('orderId', paramValidationPipe) orderId: OrderIdParamSchema,
  ) {
    const result = await this.markOrderAsReturned.execute({
      userId: user.sub,
      orderId,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case OnlyActiveUsersCanMarkOrdersAsReturnedError:
        case OnlyAssignedDeliverymanOrAdminCanMarkOrderAsReturnedError:
          throw new ForbiddenException(error.message)
        case OrderNotFoundError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException('An unexpected error occurred')
      }
    }

    const { order } = result.value
    if (!order) {
      throw new BadRequestException('Order not found after update')
    }

    return { order: OrderPresenter.toHTTP(order) }
  }
}
