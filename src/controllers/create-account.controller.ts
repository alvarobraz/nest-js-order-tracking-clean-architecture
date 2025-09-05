import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
  UsePipes,
} from '@nestjs/common'
import { hash } from 'bcryptjs'
import { PrismaService } from '@/prisma/prisma.service'
import { z } from 'zod'
import { ZodValidationPipe } from '@/pipes/zod-validation-pipe'

const createAccountBodySchema = z.object({
  name: z.string().trim().nonempty({ message: 'O nome é obrigatório' }),
  cpf: z
    .string()
    .max(11)
    .length(11, { message: 'O CPF deve ter exatamente 11 dígitos' })
    .regex(/^\d{11}$/, { message: 'O CPF deve conter apenas dígitos' })
    .transform((value) => value.replace(/[^\d]/g, '')), // Remove qualquer pontuação, se fornecida
  password: z.string(),
  email: z.string().email({ message: 'O e-mail deve ser válido' }),
  phone: z.string().regex(/^\d{2}\s?9\d{4}-?\d{4}$/, {
    message: 'O telefone deve estar no formato +55 DD 9XXXX-XXXX',
  }),
})

type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>

@Controller('/accounts')
export class CreateAccountController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createAccountBodySchema))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handle(@Body() body: CreateAccountBodySchema) {
    const { name, cpf, password, email, phone } = body

    const userWithSameEmail = await this.prisma.user.findUnique({
      where: {
        cpf,
      },
    })

    if (userWithSameEmail) {
      throw new ConflictException('User with same cpf address already exists.')
    }

    const hashedPassword = await hash(password, 8)

    await this.prisma.user.create({
      data: {
        name,
        cpf,
        password: hashedPassword,
        email,
        phone,
      },
    })
  }
}
