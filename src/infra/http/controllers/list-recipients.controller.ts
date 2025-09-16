import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { ListRecipientsUseCase } from '@/domain/order-control/application/use-cases/list-recipients'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { RecipientPresenter } from '../presenters/recipients-presenter'
import { OnlyActiveAdminsCanListRecipientsError } from '@/domain/order-control/application/use-cases/errors/only-active-admins-can-list-recipients-error'

const pageQueryParamSchema = z
  .string()
  .optional()
  .default('1')
  .transform(Number)
  .pipe(z.number().min(1))

const queryValidationPipe = new ZodValidationPipe(pageQueryParamSchema)

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>

@Controller('/recipients')
@UseGuards(JwtAuthGuard)
export class ListRecipientsController {
  constructor(private listRecipients: ListRecipientsUseCase) {}

  @Get()
  async handle(
    @Query('page', queryValidationPipe) page: PageQueryParamSchema,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.listRecipients.execute({
      adminId: user.sub,
      page,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case OnlyActiveAdminsCanListRecipientsError:
          throw new ForbiddenException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    const recipients = result.value
    return { recipients: recipients.map(RecipientPresenter.toHTTP) }
  }
}
