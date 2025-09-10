import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CreateDeliverymanUseCase } from '@/domain/order-control/application/use-cases/create-deliveryman'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

const createAccountBodySchema = z.object({
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

const bodyValidationPipe = new ZodValidationPipe(createAccountBodySchema)

type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>

@Controller('/accounts')
export class CreateAccountController {
  constructor(
    private prisma: PrismaService,
    private createDeliveryman: CreateDeliverymanUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  async handle(
    @Body(bodyValidationPipe) body: CreateAccountBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    console.log('user => ' + JSON.stringify(user))
    const { name, cpf, password, email, phone } = body

    const adminId = user.sub

    const userIsNotAdmin = await this.prisma.user.findFirst({
      where: {
        id: adminId,
      },
    })

    if (userIsNotAdmin?.role !== 'admin') {
      throw new ConflictException('User is not admin.')
    }

    const userWithSameCpf = await this.prisma.user.findUnique({
      where: {
        cpf,
      },
    })

    if (userWithSameCpf) {
      throw new ConflictException('User with same cpf address already exists.')
    }

    const userWithSameEmail = await this.prisma.user.findFirst({
      where: {
        email,
      },
    })

    if (userWithSameEmail) {
      throw new ConflictException(
        'User with same email address already exists.',
      )
    }

    const hashedPassword = await hash(password, 8)

    await this.createDeliveryman.execute({
      adminId,
      name,
      cpf,
      password: hashedPassword,
      email,
      phone,
    })
  }
}
