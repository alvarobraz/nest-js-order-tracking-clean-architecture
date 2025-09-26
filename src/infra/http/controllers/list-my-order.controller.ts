import {
  Controller,
  Get,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { ListMyOrderUseCase } from '@/domain/order-control/application/use-cases/list-my-order'
import { OrderPresenter } from '../presenters/order-presenter'
import { OnlyActiveDeliverymenCanListOrdersError } from '@/domain/order-control/application/use-cases/errors/only-active-deliverymen-can-list-orders-error'
import { UserNotFoundError } from '@/domain/order-control/application/use-cases/errors/user-not-found-error'
import { UserNotDeliverymanError } from '@/domain/order-control/application/use-cases/errors/user-not-deliveryman-error'

@Controller('/my-orders')
@UseGuards(JwtAuthGuard)
export class ListMyOrderController {
  constructor(private listMyOrder: ListMyOrderUseCase) {}

  @Get()
  async handle(@CurrentUser() user: UserPayload) {
    const result = await this.listMyOrder.execute({
      userId: user.sub,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case OnlyActiveDeliverymenCanListOrdersError:
          throw new ForbiddenException(error.message)
        case UserNotFoundError:
        case UserNotDeliverymanError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException('An unexpected error occurred')
      }
    }

    const orders = result.value
    return { orders: orders.map(OrderPresenter.toHTTP) }
  }
}
