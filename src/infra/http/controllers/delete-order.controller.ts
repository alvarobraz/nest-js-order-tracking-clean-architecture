import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  UseGuards,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { DeleteOrderUseCase } from '@/domain/order-control/application/use-cases/delete-order'
import { OnlyActiveAdminsCanDeleteOrdersError } from '@/domain/order-control/application/use-cases/errors/only-active-admins-can-delete-orders-error'
import { OrderNotFoundError } from '@/domain/order-control/application/use-cases/errors/order-not-found-error'

@Controller('/orders/:id')
@UseGuards(JwtAuthGuard)
export class DeleteOrderController {
  constructor(private deleteOrder: DeleteOrderUseCase) {}

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(@Param('id') orderId: string, @CurrentUser() user: UserPayload) {
    const result = await this.deleteOrder.execute({
      adminId: user.sub,
      orderId,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case OnlyActiveAdminsCanDeleteOrdersError:
          throw new ForbiddenException(error.message)
        case OrderNotFoundError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException('An unexpected error occurred')
      }
    }
  }
}
