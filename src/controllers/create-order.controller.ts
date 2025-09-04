import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { CurrentUser } from 'src/auth/current-user-decorator'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import type { UserPayload } from 'src/auth/jwt.strategy'
import { ZodValidationPipe } from 'src/pipes/zod-validation-pipe'
import { PrismaService } from 'src/prisma/prisma.service'
import z from 'zod'

const createOrderBodySchema = z.object({
  recipientId: z.string(),
})

const bodyValidationPipe = new ZodValidationPipe(createOrderBodySchema)

type CreateOrderBodySchema = z.infer<typeof createOrderBodySchema>

@Controller('/orders')
@UseGuards(JwtAuthGuard)
export class CreateOrderController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async handle(
    @Body(bodyValidationPipe) body: CreateOrderBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const { recipientId } = body
    const adminId = user.sub

    const admin = await this.prisma.user.findUnique({
      where: {
        id: adminId,
      },
    })

    if (!admin || admin.role !== 'ADMIN' || admin.status !== 'ACTIVE') {
      throw new UnauthorizedException('Only active admins can create orders.')
    }

    const recipient = await this.prisma.recipient.findUnique({
      where: {
        id: recipientId,
      },
    })

    // console.log('recipient ->' + JSON.stringify(recipient))

    if (!recipient) {
      throw new UnauthorizedException('Not Found recipient.')
    }

    await this.prisma.order.create({
      data: {
        id: adminId,
        recipientId,
      },
    })
  }
}
