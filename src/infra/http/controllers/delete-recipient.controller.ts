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
import { DeleteRecipientUseCase } from '@/domain/order-control/application/use-cases/delete-recipient'
import { OnlyActiveAdminsCanDeleteRecipientsError } from '@/domain/order-control/application/use-cases/errors/only-active-admins-can-delete-recipients-error'
import { RecipientNotFoundError } from '@/domain/order-control/application/use-cases/errors/recipient-not-found-error'

@Controller('/recipients/:id')
@UseGuards(JwtAuthGuard)
export class DeleteRecipientController {
  constructor(private deleteRecipient: DeleteRecipientUseCase) {}

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(
    @Param('id') recipientId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.deleteRecipient.execute({
      adminId: user.sub,
      recipientId,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case OnlyActiveAdminsCanDeleteRecipientsError:
          throw new ForbiddenException(error.message)
        case RecipientNotFoundError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException('An unexpected error occurred')
      }
    }
  }
}
