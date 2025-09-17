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
import { ListNearbyOrdersUseCase } from '@/domain/order-control/application/use-cases/list-nearby-orders'
import { OrderPresenter } from '../presenters/order-presenter'
import { OnlyActiveDeliverymenCanListNearbyOrdersError } from '@/domain/order-control/application/use-cases/errors/only-active-deliverymen-can-list-nearby-orders-error'
import { z } from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipe'

const neighborhoodQueryParamSchema = z.string().min(1)

const queryValidationPipe = new ZodValidationPipe(neighborhoodQueryParamSchema)

type NeighborhoodQueryParamSchema = z.infer<typeof neighborhoodQueryParamSchema>

@Controller('/order/nearby')
@UseGuards(JwtAuthGuard)
export class ListNearbyOrdersController {
  constructor(private listNearbyOrders: ListNearbyOrdersUseCase) {}

  @Get()
  async handle(
    @CurrentUser() user: UserPayload,
    @Query('neighborhood', queryValidationPipe)
    neighborhood: NeighborhoodQueryParamSchema,
  ) {
    const result = await this.listNearbyOrders.execute({
      deliverymanId: user.sub,
      neighborhood,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case OnlyActiveDeliverymenCanListNearbyOrdersError:
          throw new ForbiddenException(error.message)
        default:
          throw new BadRequestException('An unexpected error occurred')
      }
    }

    const orders = result.value
    return { orders: orders.map(OrderPresenter.toHTTP) }
  }
}
