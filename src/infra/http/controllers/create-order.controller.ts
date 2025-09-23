import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import z from 'zod'
import { CreateOrderUseCase } from '@/domain/order-control/application/use-cases/create-order'

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

    await this.createOrder.execute({
      adminId,
      recipientId,
    })
  }
}
