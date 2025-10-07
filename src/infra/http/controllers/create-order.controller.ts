import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import z from 'zod'
import { CreateOrderUseCase } from '@/domain/order-control/application/use-cases/create-order'
import { OnlyActiveAdminsCanCreateOrdersError } from '@/domain/order-control/application/use-cases/errors/only-active-admins-can-create-orders-error'
import { RecipientNotFoundError } from '@/domain/order-control/application/use-cases/errors/recipient-not-found-error'

const createOrderBodySchema = z.object({
  recipientId: z.string(),
})

const bodyValidationPipe = new ZodValidationPipe(createOrderBodySchema)

type CreateOrderBodySchema = z.infer<typeof createOrderBodySchema>

@Controller('/orders')
@UseGuards(JwtAuthGuard)
export class CreateOrderController {
  constructor(private createOrder: CreateOrderUseCase) {}

  @Post()
  async handle(
    @Body(bodyValidationPipe) body: CreateOrderBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const { recipientId } = body
    const adminId = user.sub

    const result = await this.createOrder.execute({
      adminId,
      recipientId,
    })

    if (result.isLeft()) {
      const error = result.value
      switch (error.constructor) {
        case OnlyActiveAdminsCanCreateOrdersError:
        case RecipientNotFoundError:
          throw new ConflictException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    const { order } = result.value
    return {
      order: {
        id: order.id.toString(),
        recipientId: order.recipientId.toString(),
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    }
  }
}
