import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, HttpStatus } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { hash } from 'bcryptjs'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'

describe('List My Order Controller (e2e)', () => {
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
    await prisma.attachment.deleteMany({})
    await prisma.order.deleteMany({})
    await prisma.recipient.deleteMany({})
    await prisma.user.deleteMany({})
  })

  async function seedDeliverymanAndOrders() {
    const deliveryman = await prisma.user.create({
      data: {
        name: 'Deliveryman User',
        cpf: '98765432100',
        password: await hash('password', 8),
        role: 'deliveryman',
        email: 'deliveryman@example.com',
        phone: '11987654324',
        status: 'active',
      },
    })

    const deliveryman2 = await prisma.user.create({
      data: {
        name: 'Deliveryman User 2',
        cpf: '99765432100',
        password: await hash('password', 8),
        role: 'deliveryman',
        email: 'deliveryman2@example.com',
        phone: '14987654324',
        status: 'active',
      },
    })

    const recipient = await prisma.recipient.create({
      data: {
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

    const order1 = await prisma.order.create({
      data: {
        recipientId: recipient.id,
        deliverymanId: deliveryman.id,
        status: 'delivered',
        createdAt: new Date('2025-09-17T02:54:27.957Z'),
      },
    })

    const order2 = await prisma.order.create({
      data: {
        recipientId: recipient.id,
        deliverymanId: deliveryman.id,
        status: 'picked_up',
        createdAt: new Date('2025-09-16T21:54:07.238Z'),
      },
    })

    await prisma.order.create({
      data: {
        recipientId: recipient.id,
        deliverymanId: deliveryman2.id,
        status: 'picked_up',
        createdAt: new Date('2025-09-16T21:54:07.238Z'),
      },
    })

    return { deliveryman, deliveryman2, recipient, order1, order2 }
  }

  it("[GET] /my-orders - should list the delivery person's own orders when he is active", async () => {
    const { deliveryman, recipient, order1, order2 } =
      await seedDeliverymanAndOrders()

    const token = jwtService.sign({ sub: deliveryman.id })

    const response = await request(app.getHttpServer())
      .get('/my-orders')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', deliveryman.id)

    expect(response.status).toBe(HttpStatus.OK)
    expect(response.body.orders).toHaveLength(2)
    expect(response.body).toEqual({
      orders: [
        expect.objectContaining({
          id: order1.id,
          recipientId: recipient.id,
          deliverymanId: deliveryman.id,
          status: 'delivered',
          createdAt: '2025-09-17T02:54:27.957Z',
          recipient: expect.objectContaining({
            id: recipient.id,
            name: 'João Silva',
            email: 'joao.silva@example.com',
            phone: '11987654322',
            street: 'Avenida Paulista',
            number: 123,
            neighborhood: 'Bela Vista',
            city: 'São Paulo',
            state: 'SP',
            zipCode: 12345678,
          }),
        }),
        expect.objectContaining({
          id: order2.id,
          recipientId: recipient.id,
          deliverymanId: deliveryman.id,
          status: 'picked_up',
          createdAt: '2025-09-16T21:54:07.238Z',
          recipient: expect.objectContaining({
            id: recipient.id,
            name: 'João Silva',
            email: 'joao.silva@example.com',
            phone: '11987654322',
            street: 'Avenida Paulista',
            number: 123,
            neighborhood: 'Bela Vista',
            city: 'São Paulo',
            state: 'SP',
            zipCode: 12345678,
          }),
        }),
      ],
    })
  })

  it('[GET] /my-orders - should return 400 if user is not found', async () => {
    const token = jwtService.sign({ sub: 'invalid-user-id' })

    const response = await request(app.getHttpServer())
      .get('/my-orders')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', 'invalid-user-id')

    expect(response.status).toBe(HttpStatus.BAD_REQUEST)
    expect(response.body.message).toBe('User not found')
  })

  it('[GET] /my-orders - should return 400 if user is not a deliveryman', async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Admin User',
        cpf: '12345678901',
        password: await hash('password', 8),
        role: 'admin',
        email: 'admin@example.com',
        phone: '11987654321',
        status: 'active',
      },
    })

    const token = jwtService.sign({ sub: user.id })

    const response = await request(app.getHttpServer())
      .get('/my-orders')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', user.id)

    expect(response.status).toBe(HttpStatus.BAD_REQUEST)
    expect(response.body.message).toBe('User is not a deliveryman')
  })

  it('[GET] /my-orders - should return 403 if deliveryman is not active', async () => {
    const deliveryman = await prisma.user.create({
      data: {
        name: 'Deliveryman User',
        cpf: '98765432100',
        password: await hash('password', 8),
        role: 'deliveryman',
        email: 'deliveryman@example.com',
        phone: '11987654324',
        status: 'inactive',
      },
    })

    const token = jwtService.sign({ sub: deliveryman.id })

    const response = await request(app.getHttpServer())
      .get('/my-orders')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', deliveryman.id)

    expect(response.status).toBe(HttpStatus.FORBIDDEN)
    expect(response.body.message).toBe(
      'Only active deliverymen can list their own orders',
    )
  })

  afterAll(async () => {
    await prisma.attachment.deleteMany({})
    await prisma.order.deleteMany({})
    await prisma.recipient.deleteMany({})
    await prisma.user.deleteMany({})
    await app.close()
  })
})
