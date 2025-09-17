import {
  Controller,
  Get,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  Query,
} from '@nestjs/common'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { ListOrdersUseCase } from '@/domain/order-control/application/use-cases/list-orders'
import { OrderPresenter } from '../presenters/order-presenter'
import { OnlyActiveAdminsCanListOrdersError } from '@/domain/order-control/application/use-cases/errors/only-active-admins-can-list-orders-error'
import { ZodValidationPipe } from '../pipes/zod-validation-pipe'
import { z } from 'zod'

const pageQueryParamSchema = z
  .string()
  .optional()
  .default('1')
  .transform(Number)
  .pipe(z.number().min(1))

const queryValidationPipe = new ZodValidationPipe(pageQueryParamSchema)

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>

@Controller('/orders')
@UseGuards(JwtAuthGuard)
export class ListOrdersController {
  constructor(private listOrders: ListOrdersUseCase) {}

  @Get()
  async handle(
    @CurrentUser() user: UserPayload,
    @Query('page', queryValidationPipe) page: PageQueryParamSchema,
  ) {
    const result = await this.listOrders.execute({
      adminId: user.sub,
      page,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case OnlyActiveAdminsCanListOrdersError:
          throw new ForbiddenException(error.message)
        default:
          throw new BadRequestException('An unexpected error occurred')
      }
    }

    const orders = result.value
    return { orders: orders.map(OrderPresenter.toHTTP) }
  }
}
