import {
  Controller,
  Get,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  Param,
} from '@nestjs/common'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { ListUserDeliveriesUseCase } from '@/domain/order-control/application/use-cases/list-user-deliveries'
import { OrderPresenter } from '../presenters/order-presenter'
import { OnlyActiveAdminsCanListDeliverymenError } from '@/domain/order-control/application/use-cases/errors/only-active-admins-can-list-deliverymen-error'
import { UserNotFoundError } from '@/domain/order-control/application/use-cases/errors/user-not-found-error'
import { UserNotDeliverymanError } from '@/domain/order-control/application/use-cases/errors/user-not-deliveryman-error'
import { z } from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipe'

const userIdParamSchema = z.string().uuid()
const paramValidationPipe = new ZodValidationPipe(userIdParamSchema)
type UserIdParamSchema = z.infer<typeof userIdParamSchema>

@Controller('/deliveries/:userId')
@UseGuards(JwtAuthGuard)
export class ListUserDeliveriesController {
  constructor(private listUserDeliveries: ListUserDeliveriesUseCase) {}

  @Get()
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('userId', paramValidationPipe) userId: UserIdParamSchema,
  ) {
    const result = await this.listUserDeliveries.execute({
      adminId: user.sub,
      userId,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case OnlyActiveAdminsCanListDeliverymenError:
          throw new ForbiddenException(error.message)
        case UserNotFoundError:
        case UserNotDeliverymanError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException('An unexpected error occurred')
      }
    }

    const deliveries = result.value
    return { deliveries: deliveries.map(OrderPresenter.toHTTP) }
  }
}
