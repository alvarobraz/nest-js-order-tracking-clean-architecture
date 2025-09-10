import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { ListDeliverymenUseCase } from '@/domain/order-control/application/use-cases/list-deliverymen'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { UserPresenter } from '../presenters/users-presenter'

const pageQueryParamSchema = z
  .string()
  .optional()
  .default('1')
  .transform(Number)
  .pipe(z.number().min(1))

const queryValidationPipe = new ZodValidationPipe(pageQueryParamSchema)

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>

@Controller('/users')
@UseGuards(JwtAuthGuard)
export class FetchRecentQuestionsController {
  constructor(private listDeliverymen: ListDeliverymenUseCase) {}

  @Get()
  async handle(
    @Query('page', queryValidationPipe) page: PageQueryParamSchema,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.listDeliverymen.execute({
      adminId: user.sub,
      page,
    })

    if (result.isLeft()) {
      throw new Error()
    }

    const users = result.value

    return { users: users.map(UserPresenter.toHTTP) }
  }
}
