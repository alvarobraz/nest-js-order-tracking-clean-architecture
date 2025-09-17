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
import { OrderPresenter } from '../presenters/order-presenter'
import { OnlyActiveAdminsCanListOrdersError } from '@/domain/order-control/application/use-cases/errors/only-active-admins-can-list-orders-error'
import { OrderByIdUseCase } from '@/domain/order-control/application/use-cases/order-by-id'
import { OrderNotFoundError } from '@/domain/order-control/application/use-cases/errors/order-not-found-error'

@Controller('/orders/:id')
@UseGuards(JwtAuthGuard)
export class OrderByIdController {
  constructor(private orderById: OrderByIdUseCase) {}

  @Get()
  async handle(@Param('id') orderId: string, @CurrentUser() user: UserPayload) {
    const result = await this.orderById.execute({
      adminId: user.sub,
      orderId,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case OnlyActiveAdminsCanListOrdersError:
          throw new ForbiddenException(error.message)
        case OrderNotFoundError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException('An unexpected error occurred')
      }
    }

    const order = result.value
    return { order: OrderPresenter.toHTTP(order) }
  }
}
