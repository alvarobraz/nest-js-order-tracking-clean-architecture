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
import { RecipientPresenter } from '../presenters/recipients-presenter'
import { OnlyActiveAdminsCanListRecipientsError } from '@/domain/order-control/application/use-cases/errors/only-active-admins-can-list-recipients-error'
import { RecipientByIdUseCase } from '@/domain/order-control/application/use-cases/recipient-by-id'
import { RecipientNotFoundError } from '@/domain/order-control/application/use-cases/errors/recipient-not-found-error'

@Controller('/recipients/:id')
@UseGuards(JwtAuthGuard)
export class RecipientByIdController {
  constructor(private recipientById: RecipientByIdUseCase) {}

  @Get()
  async handle(
    @Param('id') recipientId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.recipientById.execute({
      adminId: user.sub,
      recipientId,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case OnlyActiveAdminsCanListRecipientsError:
          throw new ForbiddenException(error.message)
        case RecipientNotFoundError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException('An unexpected error occurred')
      }
    }

    const recipient = result.value
    return { recipient: RecipientPresenter.toHTTP(recipient) }
  }
}
