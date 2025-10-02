import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import z from 'zod'
import { CreateRecipientUseCase } from '@/domain/order-control/application/use-cases/create-recipient'
import { OnlyActiveAdminsCanCreateRecipientsError } from '@/domain/order-control/application/use-cases/errors/only-active-admins-can-create-recipients-error'
import { RecipientAlreadyExistsError } from '@/domain/order-control/application/use-cases/errors/recipient-already-exists'

const createRecipientBodySchema = z.object({
  userId: z.string(),
  name: z.string().min(7, 'Name is required'),
  street: z.string().min(4, 'Street is required'),
  number: z
    .number()
    .int()
    .positive()
    .min(1, 'Number must be a positive integer'),
  neighborhood: z.string().min(1, 'Neighborhood is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z
    .number()
    .int()
    .positive()
    .refine((value) => /^\d{8}$/.test(value.toString()), {
      message: 'ZipCode must be an 8-digit number (e.g., 12345678)',
    }),
  phone: z.string().refine((value) => /^\d{10,11}$/.test(value.toString()), {
    message: 'Phone must be a 10 or 11-digit number (e.g., 11987654321)',
  }),
  email: z.string().email('Invalid email format'),
})

const bodyValidationPipe = new ZodValidationPipe(createRecipientBodySchema)

type CreateRecipientBodySchema = z.infer<typeof createRecipientBodySchema>

@Controller('/recipients')
@UseGuards(JwtAuthGuard)
export class CreateRecipientController {
  constructor(private createRecipient: CreateRecipientUseCase) {}

  @Post()
  async handle(
    @Body(bodyValidationPipe) body: CreateRecipientBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const {
      userId,
      name,
      street,
      number,
      neighborhood,
      city,
      state,
      zipCode,
      phone,
      email,
    } = body
    const adminId = user.sub

    const result = await this.createRecipient.execute({
      adminId,
      userId,
      name,
      street,
      number,
      neighborhood,
      city,
      state,
      zipCode,
      phone,
      email,
    })

    if (result.isLeft()) {
      const error = result.value
      switch (error.constructor) {
        case OnlyActiveAdminsCanCreateRecipientsError:
          throw new UnauthorizedException(error.message)
        case RecipientAlreadyExistsError:
          throw new ConflictException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
