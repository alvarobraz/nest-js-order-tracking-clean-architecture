import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { compare } from 'bcryptjs'
import { ZodValidationPipe } from 'src/pipes/zod-validation-pipe'
import { PrismaService } from 'src/prisma/prisma.service'
import { z } from 'zod'

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
  ) {}

  @Post()
  @UsePipes(new ZodValidationPipe(authenticateBodySchema))
  async handle(@Body() body: AuthenticateBodySchema) {
    const { cpf, password } = body

    const user = await this.prisma.user.findUnique({
      where: {
        cpf,
      },
    })

    if (!user) {
      throw new UnauthorizedException('User credentials do not match.')
    }

    const isPasswordValid = await compare(password, user.password)

    if (!isPasswordValid) {
      throw new UnauthorizedException('User credentials do not match.')
    }

    const accessToken = this.jwt.sign({ sub: user.id })

    return {
      access_token: accessToken,
    }
  }
}
