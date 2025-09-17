import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, HttpStatus } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { hash } from 'bcryptjs'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'

describe('List Nearby Orders Controller (e2e)', () => {
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
    await prisma.orderAttachment.deleteMany({})
    await prisma.order.deleteMany({})
    await prisma.recipient.deleteMany({})
    await prisma.user.deleteMany({})
  })

  async function seedDeliverymanAndOrder() {
    const deliveryman = await prisma.user.create({
      data: {
        id: 'deliveryman-1',
        name: 'Deliveryman User',
        cpf: '98765432100',
        password: await hash('password', 8),
        role: 'deliveryman',
        email: 'deliveryman@example.com',
        phone: '21999887766',
        status: 'active',
      },
    })

    const recipient = await prisma.recipient.create({
      data: {
        id: 'recipient-1',
        name: 'Mariana Costa',
        street: 'Avenida das Américas',
        number: 456,
        neighborhood: 'Barra da Tijuca',
        city: 'Rio de Janeiro',
        state: 'RJ',
        zipCode: 22640002,
        phone: '21999887766',
        email: 'mariana.costa@example.com',
      },
    })

    const order = await prisma.order.create({
      data: {
        id: 'order-1',
        recipientId: 'recipient-1',
        status: 'pending',
        createdAt: new Date('2025-09-17T04:09:20.173Z'),
      },
    })

    return { deliveryman, recipient, order }
  }

  it('[GET] /order/nearby - should list nearby orders for an active deliveryman with partial neighborhood match', async () => {
    const { deliveryman } = await seedDeliverymanAndOrder()

    const token = jwtService.sign({ sub: deliveryman.id })

    const response = await request(app.getHttpServer())
      .get('/order/nearby?neighborhood=Barra')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', deliveryman.id)

    expect(response.status).toBe(HttpStatus.OK)
    expect(response.body.orders).toHaveLength(1)
    expect(response.body).toEqual({
      orders: [
        expect.objectContaining({
          id: 'order-1',
          recipientId: 'recipient-1',
          status: 'pending',
          createdAt: '2025-09-17T04:09:20.173Z',
          recipient: expect.objectContaining({
            id: 'recipient-1',
            name: 'Mariana Costa',
            email: 'mariana.costa@example.com',
            phone: '21999887766',
            street: 'Avenida das Américas',
            number: 456,
            neighborhood: 'Barra da Tijuca',
            city: 'Rio de Janeiro',
            state: 'RJ',
            zipCode: 22640002,
          }),
        }),
      ],
    })

    const responseLowerCase = await request(app.getHttpServer())
      .get('/order/nearby?neighborhood=barr')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', deliveryman.id)

    expect(responseLowerCase.status).toBe(HttpStatus.OK)
    expect(responseLowerCase.body.orders).toHaveLength(1)
    expect(responseLowerCase.body.orders[0].recipient.neighborhood).toBe(
      'Barra da Tijuca',
    )
  })

  it('[GET] /order/nearby - should return empty list if no orders match the neighborhood', async () => {
    const { deliveryman } = await seedDeliverymanAndOrder()

    const token = jwtService.sign({ sub: deliveryman.id })

    const response = await request(app.getHttpServer())
      .get('/order/nearby?neighborhood=NonExistent')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', deliveryman.id)

    expect(response.status).toBe(HttpStatus.OK)
    expect(response.body.orders).toHaveLength(0)
    expect(response.body).toEqual({ orders: [] })
  })

  it('[GET] /order/nearby - should return 403 if user is not an active deliveryman', async () => {
    await seedDeliverymanAndOrder()

    const admin = await prisma.user.create({
      data: {
        id: 'admin-1',
        name: 'Admin User',
        cpf: '12345678901',
        password: await hash('password', 8),
        role: 'admin',
        email: 'admin@example.com',
        phone: '21987654321',
        status: 'active',
      },
    })

    const token = jwtService.sign({ sub: admin.id })

    const response = await request(app.getHttpServer())
      .get('/order/nearby?neighborhood=Barra')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', admin.id)

    expect(response.status).toBe(HttpStatus.FORBIDDEN)
    expect(response.body.message).toContain(
      'Only active deliverymen can list nearby orders',
    )
  })

  afterAll(async () => {
    await prisma.orderAttachment.deleteMany({})
    await prisma.order.deleteMany({})
    await prisma.recipient.deleteMany({})
    await prisma.user.deleteMany({})
    await app.close()
  })
})
