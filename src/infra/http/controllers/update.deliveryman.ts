import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Param,
  Put,
  NotFoundException,
  UseGuards,
} from '@nestjs/common'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { UpdateDeliverymanUseCase } from '@/domain/order-control/application/use-cases/update-deliveryman'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'

const updateDeliverymanBodySchema = z.object({
  name: z
    .string()
    .trim()
    .nonempty({ message: 'O nome é obrigatório' })
    .optional(),
  email: z.string().email({ message: 'O e-mail deve ser válido' }).optional(),
  phone: z
    .string()
    .refine((value) => /^\d{10,11}$/.test(value.toString()), {
      message: 'Phone must be a 10 or 11-digit number (e.g., 11987654321)',
    })
    .optional(),
  password: z.string().optional(),
})

const bodyValidationPipe = new ZodValidationPipe(updateDeliverymanBodySchema)

type UpdateDeliverymanBodySchema = z.infer<typeof updateDeliverymanBodySchema>

@Controller('/users/:id')
export class UpdateDeliverymanController {
  constructor(
    private updateDeliveryman: UpdateDeliverymanUseCase,
    private usersRepository: UsersRepository,
  ) {}

  @Put()
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async handle(
    @Body(bodyValidationPipe) body: UpdateDeliverymanBodySchema,
    @CurrentUser() user: UserPayload,
    @Param('id') deliverymanId: string,
  ) {
    const adminId = user.sub

    const { name, email, phone, password } = body

    const deliveryman = await this.usersRepository.findById(deliverymanId)
    if (!deliveryman) {
      throw new NotFoundException('Deliveryman not found')
    }

    const result = await this.updateDeliveryman.execute({
      adminId,
      deliverymanId,
      name: name ?? deliveryman.name,
      email: email ?? deliveryman.email ?? undefined,
      phone: phone ?? deliveryman.phone ?? undefined,
      password: password ?? deliveryman.password,
    })

    if (result.isLeft()) {
      throw new BadRequestException(result.value.message)
    }
  }
}
