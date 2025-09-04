import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'

@Controller('/accounts')
export class CreateAccountController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @HttpCode(201)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handle(@Body() body: any) {
    const { name, cpf, password, email, phone } = body

    const userWithSameEmail = await this.prisma.user.findUnique({
      where: {
        cpf,
      },
    })

    if (userWithSameEmail) {
      throw new ConflictException('User with same cpf address already exists.')
    }

    await this.prisma.user.create({
      data: {
        name,
        cpf,
        password,
        email,
        phone,
      },
    })
  }
}
