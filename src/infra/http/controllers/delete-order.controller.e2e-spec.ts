import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, HttpStatus } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { hash } from 'bcryptjs'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'

describe('Delete Order Controller (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwtService: JwtService

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          const req = context.switchToHttp().getRequest()
          req.user = { sub: req.headers['x-user-id'] }
          return true
        },
      })
      .compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    jwtService = moduleRef.get<JwtService>(JwtService)
    await app.init()
  })

  beforeEach(async () => {
    await prisma.order.deleteMany({}) // Deletar ordens primeiro
    await prisma.recipient.deleteMany({})
    await prisma.user.deleteMany({})
  })

  async function seedAdminAndOrder() {
    const admin = await prisma.user.create({
      data: {
        id: 'admin-1',
        name: 'Admin User',
        cpf: '12345678901',
        password: await hash('password', 8),
        role: 'admin',
        email: 'admin@example.com',
        phone: '11987654321',
        status: 'active',
      },
    })

    const userRecipient = await prisma.user.create({
      data: {
        name: 'Fernanda Costa',
        cpf: '98765432100',
        password: '1234567',
        role: 'recipient',
        email: 'fernanda.costa@example.com',
        phone: '31988776655',
      },
    })

    const recipient = await prisma.recipient.create({
      data: {
        userId: userRecipient.id,
        name: 'João Silva',
        street: 'Avenida Paulista',
        number: 123,
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipCode: 12345678,
        phone: '11987654322',
        email: 'joao.silva@example.com',
      },
    })

    const order = await prisma.order.create({
      data: {
        id: 'order-1',
        recipientId: recipient.id,
        status: 'pending',
        createdAt: new Date(),
      },
    })

    return { admin, recipient, order }
  }

  it('[DELETE] /orders/:id - should delete an existing order for an active admin', async () => {
    const { admin, order } = await seedAdminAndOrder()

    const token = jwtService.sign({ sub: admin.id })

    const response = await request(app.getHttpServer())
      .delete(`/orders/${order.id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', admin.id)

    expect(response.status).toBe(HttpStatus.NO_CONTENT)

    const orderInDb = await prisma.order.findUnique({
      where: { id: order.id },
    })

    expect(orderInDb).toBeNull()
  })

  it('[DELETE] /orders/:id - should return 400 if order does not exist', async () => {
    const { admin } = await seedAdminAndOrder()

    const token = jwtService.sign({ sub: admin.id })

    const response = await request(app.getHttpServer())
      .delete('/orders/non-existent-id')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', admin.id)

    expect(response.status).toBe(HttpStatus.BAD_REQUEST)
    expect(response.body.message).toContain('Order not found')
  })

  it('[DELETE] /orders/:id - should return 403 if user is not an active admin', async () => {
    const { order } = await seedAdminAndOrder()

    const deliveryman = await prisma.user.create({
      data: {
        name: 'Deliveryman User',
        cpf: '98765432800',
        password: await hash('password', 8),
        role: 'deliveryman',
        email: 'deliveryman@example.com',
        phone: '11987654324',
        status: 'active',
      },
    })

    const token = jwtService.sign({ sub: deliveryman.id })

    const response = await request(app.getHttpServer())
      .delete(`/orders/${order.id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', deliveryman.id)

    expect(response.status).toBe(HttpStatus.FORBIDDEN)
    expect(response.body.message).toContain(
      'Only active admins can delete orders',
    )
  })

  afterAll(async () => {
    await prisma.order.deleteMany({})
    await prisma.recipient.deleteMany({})
    await prisma.user.deleteMany({})
    await app.close()
  })
})
