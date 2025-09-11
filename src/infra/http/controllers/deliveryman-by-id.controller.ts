import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { UserPresenter } from '../presenters/users-presenter'
import { OnlyActiveAdminsCanListDeliverymenError } from '@/domain/order-control/application/use-cases/errors/only-active-admins-can-list-deliverymen-error'
import { DeliverymenByIdUseCase } from '@/domain/order-control/application/use-cases/deliverymen-by-id'
import { ActiveDeliverymanNotFoundError } from '@/domain/order-control/application/use-cases/errors/active-deliveryman-not-found-error'

@Controller('/users/:id')
@UseGuards(JwtAuthGuard)
export class DeliverymenByIdController {
  constructor(private deliverymenById: DeliverymenByIdUseCase) {}

  @Get()
  async handle(@Param('id') userId: string, @CurrentUser() user: UserPayload) {
    const result = await this.deliverymenById.execute({
      adminId: user.sub,
      userId,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case OnlyActiveAdminsCanListDeliverymenError:
          throw new ForbiddenException(error.message)
        case ActiveDeliverymanNotFoundError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException('An unexpected error occurred')
      }
    }

    const deliveryman = result.value
    return { user: UserPresenter.toHTTP(deliveryman) }
  }
}
