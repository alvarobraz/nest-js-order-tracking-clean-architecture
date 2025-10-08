import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, HttpStatus } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { hash } from 'bcryptjs'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'

describe('List Deliveryman Controller (e2e)', () => {
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
    await prisma.user.deleteMany({})
  })

  async function seedAdminAndDeliverymen() {
    const admin = await prisma.user.create({
      data: {
        name: 'John Doe',
        cpf: '12365478932',
        password: await hash('password', 8),
        role: 'admin',
        email: 'johndoe@example.com',
        phone: '41997458547',
        status: 'active',
      },
    })

    const deliveryman1 = await prisma.user.create({
      data: {
        name: 'Deliveryman One',
        cpf: '98765432100',
        password: await hash('password', 8),
        role: 'deliveryman',
        email: 'deliveryman1@example.com',
        phone: '11987654324',
        status: 'active',
      },
    })

    const deliveryman2 = await prisma.user.create({
      data: {
        name: 'Deliveryman Two',
        cpf: '99765432100',
        password: await hash('password', 8),
        role: 'deliveryman',
        email: 'deliveryman2@example.com',
        phone: '14987654324',
        status: 'active',
      },
    })

    const inactiveDeliveryman = await prisma.user.create({
      data: {
        name: 'Inactive Deliveryman',
        cpf: '97765432100',
        password: await hash('password', 8),
        role: 'deliveryman',
        email: 'inactive.deliveryman@example.com',
        phone: '15987654324',
        status: 'inactive',
      },
    })

    return { admin, deliveryman1, deliveryman2, inactiveDeliveryman }
  }

  it('[GET] /users - should list active deliverymen when user is an active admin', async () => {
    const { admin, deliveryman1, deliveryman2 } =
      await seedAdminAndDeliverymen()

    const token = jwtService.sign({ sub: admin.id })

    const response = await request(app.getHttpServer())
      .get('/users?page=1')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', admin.id)

    expect(response.status).toBe(HttpStatus.OK)
    expect(response.body.users).toHaveLength(2)
    expect(response.body).toEqual({
      users: [
        expect.objectContaining({
          id: deliveryman2.id,
          name: 'Deliveryman Two',
          cpf: '99765432100',
          email: 'deliveryman2@example.com',
          phone: '14987654324',
          role: 'deliveryman',
          status: 'active',
        }),
        expect.objectContaining({
          id: deliveryman1.id,
          name: 'Deliveryman One',
          cpf: '98765432100',
          email: 'deliveryman1@example.com',
          phone: '11987654324',
          role: 'deliveryman',
          status: 'active',
        }),
      ],
    })
  })

  it('[GET] /users - should return 400 if user is not an admin', async () => {
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

    const token = jwtService.sign({ sub: deliveryman.id })

    const response = await request(app.getHttpServer())
      .get('/users?page=1')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', deliveryman.id)

    expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    expect(response.body.message).toBe('Internal server error')
  })

  it('[GET] /users - should return 403 if admin is not active', async () => {
    const inactiveAdmin = await prisma.user.create({
      data: {
        name: 'Inactive Admin',
        cpf: '12345678901',
        password: await hash('password', 8),
        role: 'admin',
        email: 'inactive.admin@example.com',
        phone: '11987654321',
        status: 'inactive',
      },
    })

    const token = jwtService.sign({ sub: inactiveAdmin.id })

    const response = await request(app.getHttpServer())
      .get('/users?page=1')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', inactiveAdmin.id)

    expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    expect(response.body.message).toBe('Internal server error')
  })

  it('[GET] /users - should return 401 if not authenticated', async () => {
    const response = await request(app.getHttpServer()).get('/users?page=1')

    expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    expect(response.body.message).toBe('Internal server error')
  })

  afterAll(async () => {
    await prisma.user.deleteMany({})
    await app.close()
  })
})
