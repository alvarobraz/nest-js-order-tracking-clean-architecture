import {
  BadRequestException,
  Controller,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
  Put,
} from '@nestjs/common'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { UpdateRecipientUseCase } from '@/domain/order-control/application/use-cases/update-recipient'
import { RecipientPresenter } from '../presenters/recipients-presenter'
import { OnlyActiveAdminsCanUpdateRecipientsError } from '@/domain/order-control/application/use-cases/errors/only-active-admins-can-update-recipients-error'
import { RecipientNotFoundError } from '@/domain/order-control/application/use-cases/errors/recipient-not-found-error'

const updateRecipientBodySchema = z.object({
  name: z.string().optional(),
  street: z.string().optional(),
  number: z.number().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.number().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

const bodyValidationPipe = new ZodValidationPipe(updateRecipientBodySchema)

type UpdateRecipientBodySchema = z.infer<typeof updateRecipientBodySchema>

@Controller('/recipients/:id')
@UseGuards(JwtAuthGuard)
export class UpdateRecipientController {
  constructor(private updateRecipient: UpdateRecipientUseCase) {}

  @Put()
  async handle(
    @Param('id') recipientId: string,
    @Body(bodyValidationPipe) body: UpdateRecipientBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.updateRecipient.execute({
      adminId: user.sub,
      recipientId,
      ...body,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case OnlyActiveAdminsCanUpdateRecipientsError:
          throw new ForbiddenException(error.message)
        case RecipientNotFoundError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException('An unexpected error occurred')
      }
    }

    const { recipient } = result.value
    return { recipient: RecipientPresenter.toHTTP(recipient) }
  }
}
