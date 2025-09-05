import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { CurrentUser } from '@/auth/current-user-decorator'
import { JwtAuthGuard } from '@/auth/jwt-auth.guard'
import type { UserPayload } from '@/auth/jwt.strategy'
import { ZodValidationPipe } from '@/pipes/zod-validation-pipe'
import { PrismaService } from '@/prisma/prisma.service'
import z from 'zod'

const createRecipientBodySchema = z.object({
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
  phone: z
    .number()
    .int()
    .positive()
    .refine((value) => /^\d{10,11}$/.test(value.toString()), {
      message: 'Phone must be a 10 or 11-digit number (e.g., 11987654321)',
    }),
  email: z.string().email('Invalid email format'),
})

const bodyValidationPipe = new ZodValidationPipe(createRecipientBodySchema)

type CreateRecipientBodySchema = z.infer<typeof createRecipientBodySchema>

@Controller('/recipients')
@UseGuards(JwtAuthGuard)
export class CreateRecipientController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async handle(
    @Body(bodyValidationPipe) body: CreateRecipientBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const {
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

    const admin = await this.prisma.user.findUnique({
      where: {
        id: adminId,
      },
    })

    if (!admin || admin.role !== 'ADMIN' || admin.status !== 'ACTIVE') {
      throw new UnauthorizedException(
        'Only active admins can create recipients.',
      )
    }

    await this.prisma.recipient.create({
      data: {
        userId: adminId,
        name,
        street,
        number,
        neighborhood,
        city,
        state,
        zipCode,
        phone,
        email,
      },
    })
  }
}
