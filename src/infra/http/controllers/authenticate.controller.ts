import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { z } from 'zod'
import { LoginUserUseCase } from '@/domain/order-control/application/use-cases/login-user'
import { InvalidCredentialsError } from '@/domain/order-control/application/use-cases/errors/invalid-credentials-error'
import { UserAccountIsInactiveError } from '@/domain/order-control/application/use-cases/errors/user-account-is-inactive-error'

const authenticateBodySchema = z.object({
  cpf: z
    .string()
    .max(11)
    .length(11, { message: 'O CPF deve ter exatamente 11 dígitos' })
    .regex(/^\d{11}$/, { message: 'O CPF deve conter apenas dígitos' })
    .transform((value) => value.replace(/[^\d]/g, '')), // Remove qualquer pontuação, se fornecida
  password: z.string(),
})

type AuthenticateBodySchema = z.infer<typeof authenticateBodySchema>

@Controller('/sessions')
export class AuthenticateController {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private loginUser: LoginUserUseCase,
  ) {}

  @Post()
  @UsePipes(new ZodValidationPipe(authenticateBodySchema))
  async handle(@Body() body: AuthenticateBodySchema) {
    const { cpf, password } = body

    const result = await this.loginUser.execute({
      cpf,
      password,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case InvalidCredentialsError:
          throw new UnauthorizedException(error.message)
        case UserAccountIsInactiveError:
          throw new UnauthorizedException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    const accessToken = this.jwt.sign({ sub: result.value })

    return {
      access_token: accessToken,
    }
  }
}
