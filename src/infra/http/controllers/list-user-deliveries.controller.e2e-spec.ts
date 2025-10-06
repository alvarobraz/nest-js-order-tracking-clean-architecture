import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, HttpStatus } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { hash } from 'bcryptjs'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'

describe('List User Deliveries Controller (e2e)', () => {
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

  async function seedAdminAndOrders() {
    const admin = await prisma.user.create({
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

    const userRecipient = await prisma.user.create({
      data: {
        name: 'Fernanda Costa',
        cpf: '06609931046',
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

    const orders = await Promise.all([
      prisma.order.create({
        data: {
          recipientId: recipient.id,
          deliverymanId: deliveryman.id,
          status: 'delivered',
          createdAt: new Date('2025-09-17T02:54:27.957Z'),
        },
      }),
      prisma.order.create({
        data: {
          recipientId: recipient.id,
          deliverymanId: deliveryman.id,
          status: 'pending',
          createdAt: new Date('2025-09-16T21:54:07.238Z'),
        },
      }),
    ])

    return { admin, deliveryman, recipient, orders }
  }

  it('[GET] /deliveries/:userId - should list delivered orders for a deliveryman if admin is active', async () => {
    const { admin, deliveryman, recipient } = await seedAdminAndOrders()

    const token = jwtService.sign({ sub: admin.id })

    const response = await request(app.getHttpServer())
      .get(`/deliveries/${deliveryman.id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', admin.id)

    expect(response.status).toBe(HttpStatus.OK)
    expect(response.body.deliveries).toHaveLength(1)

    expect(response.body).toEqual({
      deliveries: [
        expect.objectContaining({
          id: expect.any(String),
          recipientId: recipient.id,
          deliverymanId: deliveryman.id,
          status: 'delivered',
          createdAt: '2025-09-17T02:54:27.957Z',
          updatedAt: expect.any(String),
          deliveryPhoto: expect.any(Array),
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

  it('[GET] /deliveries/:userId - should list delivered orders for a deliveryman if requested by themselves', async () => {
    const { deliveryman, recipient } = await seedAdminAndOrders()

    const token = jwtService.sign({ sub: deliveryman.id })

    const response = await request(app.getHttpServer())
      .get(`/deliveries/${deliveryman.id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', deliveryman.id)

    expect(response.status).toBe(HttpStatus.OK)
    expect(response.body.deliveries).toHaveLength(1)
    expect(response.body).toEqual({
      deliveries: [
        expect.objectContaining({
          id: expect.any(String),
          recipientId: recipient.id,
          deliverymanId: deliveryman.id,
          status: 'delivered',
          createdAt: '2025-09-17T02:54:27.957Z',
          updatedAt: expect.any(String),
          deliveryPhoto: expect.any(Array),
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

  it('[GET] /deliveries/:userId - should return 403 if user is not an active admin or the deliveryman themselves', async () => {
    const { admin } = await seedAdminAndOrders()

    const deliveryman2 = await prisma.user.create({
      data: {
        id: 'deliveryman-2',
        name: 'Other Deliveryman',
        cpf: '12345678902',
        password: await hash('password', 8),
        role: 'deliveryman',
        email: 'other.deliveryman@example.com',
        phone: '11987654325',
        status: 'active',
      },
    })

    const token = jwtService.sign({ sub: deliveryman2.id })

    const response = await request(app.getHttpServer())
      .get(`/deliveries/${admin.id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', deliveryman2.id)

    expect(response.status).toBe(HttpStatus.FORBIDDEN)
    expect(response.body.message).toContain(
      'Only active admins can list deliverymen',
    )
  })

  it('[GET] /deliveries/:userId - should return 400 if user is not found', async () => {
    const { admin } = await seedAdminAndOrders()

    const token = jwtService.sign({ sub: admin.id })

    const response = await request(app.getHttpServer())
      .get('/deliveries/a2f22a5c-e3f4-4b79-8d0c-3045c635d2a4')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', admin.id)

    expect(response.status).toBe(HttpStatus.BAD_REQUEST)
    expect(response.body.message).toBe('User not found')
  })

  it('[GET] /deliveries/:userId - should return 400 if user is not a deliveryman', async () => {
    const { admin } = await seedAdminAndOrders()

    const token = jwtService.sign({ sub: admin.id })

    const response = await request(app.getHttpServer())
      .get(`/deliveries/${admin.id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', admin.id)

    expect(response.status).toBe(HttpStatus.BAD_REQUEST)
    expect(response.body.message).toBe('User is not a deliveryman')
  })

  afterAll(async () => {
    await prisma.attachment.deleteMany({})
    await prisma.order.deleteMany({})
    await prisma.recipient.deleteMany({})
    await prisma.user.deleteMany({})
    await app.close()
  })
})
