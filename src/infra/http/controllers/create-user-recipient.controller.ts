import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CreateUserRecipientUseCase } from '@/domain/order-control/application/use-cases/create-user-recipient'

const createRecipientBodySchema = z.object({
  name: z.string().trim().nonempty({ message: 'O nome é obrigatório' }),
  cpf: z
    .string()
    .max(11)
    .length(11, { message: 'O CPF deve ter exatamente 11 dígitos' })
    .regex(/^\d{11}$/, { message: 'O CPF deve conter apenas dígitos' })
    .transform((value) => value.replace(/[^\d]/g, '')),
  password: z.string(),
  email: z.string().email({ message: 'O e-mail deve ser válido' }),
  phone: z.string().regex(/^\d{2}\s?9\d{4}-?\d{4}$/, {
    message: 'O telefone deve estar no formato +55 DD 9XXXX-XXXX',
  }),
})

const bodyValidationPipe = new ZodValidationPipe(createRecipientBodySchema)

type CreateRecipientBodySchema = z.infer<typeof createRecipientBodySchema>

@Controller('/user-recipient')
export class CreateUserRecipientController {
  constructor(private createRecipient: CreateUserRecipientUseCase) {}

  @Post()
  @HttpCode(201)
  async handle(@Body(bodyValidationPipe) body: CreateRecipientBodySchema) {
    const { name, cpf, password, email, phone } = body

    const result = await this.createRecipient.execute({
      name,
      cpf,
      password,
      email,
      phone,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ConflictException:
          throw new ConflictException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
