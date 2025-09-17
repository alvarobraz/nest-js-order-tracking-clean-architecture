import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, HttpStatus } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { hash } from 'bcryptjs'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'

describe('List Orders Controller (e2e)', () => {
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

  async function seedAdminAndOrders() {
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

    const recipient = await prisma.recipient.create({
      data: {
        id: 'recipient-1',
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

    const orders = await Promise.all([
      prisma.order.create({
        data: {
          id: 'order-1',
          recipientId: 'recipient-1',
          status: 'pending',
          createdAt: new Date('2025-09-17T02:54:27.957Z'),
        },
      }),
      prisma.order.create({
        data: {
          id: 'order-2',
          recipientId: 'recipient-1',
          status: 'pending',
          createdAt: new Date('2025-09-16T21:54:07.238Z'),
        },
      }),
    ])

    return { admin, recipient, orders }
  }

  it('[GET] /orders - should list orders for an active admin', async () => {
    const { admin } = await seedAdminAndOrders()

    const token = jwtService.sign({ sub: admin.id })

    const response = await request(app.getHttpServer())
      .get('/orders?page=1')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', admin.id)

    expect(response.status).toBe(HttpStatus.OK)
    expect(response.body.orders).toHaveLength(2)
    expect(response.body).toEqual({
      orders: [
        expect.objectContaining({
          id: 'order-1',
          recipientId: 'recipient-1',
          status: 'pending',
          createdAt: '2025-09-17T02:54:27.957Z',
          recipient: expect.objectContaining({
            id: 'recipient-1',
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
          id: 'order-2',
          recipientId: 'recipient-1',
          status: 'pending',
          createdAt: '2025-09-16T21:54:07.238Z',
          recipient: expect.objectContaining({
            id: 'recipient-1',
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

  it('[GET] /orders - should return empty list for an active admin when page is empty', async () => {
    const { admin } = await seedAdminAndOrders()

    const token = jwtService.sign({ sub: admin.id })

    const response = await request(app.getHttpServer())
      .get('/orders?page=2')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', admin.id)

    expect(response.status).toBe(HttpStatus.OK)
    expect(response.body.orders).toHaveLength(0)
    expect(response.body).toEqual({ orders: [] })
  })

  it('[GET] /orders - should return 403 if user is not an active admin', async () => {
    await seedAdminAndOrders()

    const deliveryman = await prisma.user.create({
      data: {
        id: 'deliveryman-1',
        name: 'Deliveryman User',
        cpf: '98765432100',
        password: await hash('password', 8),
        role: 'deliveryman',
        email: 'deliveryman@example.com',
        phone: '11987654324',
        status: 'active',
      },
    })

    const token = jwtService.sign({ sub: deliveryman.id })

    const response = await request(app.getHttpServer())
      .get('/orders?page=1')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', deliveryman.id)

    expect(response.status).toBe(HttpStatus.FORBIDDEN)
    expect(response.body.message).toContain(
      'Only active admins can list orders',
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
