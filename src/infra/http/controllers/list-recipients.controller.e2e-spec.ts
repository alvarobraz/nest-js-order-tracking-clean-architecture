import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, HttpStatus } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { hash } from 'bcryptjs'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'

describe('List Recipients Controller (e2e)', () => {
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
          const request = context.switchToHttp().getRequest()
          request.user = { sub: request.headers['x-user-id'] }
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
    await prisma.recipient.deleteMany({})
  })

  async function seedAdminAndRecipients() {
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

    const recipient1 = await prisma.recipient.create({
      data: {
        name: 'Ana Costa',
        street: 'Avenida Paulista',
        number: 123,
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipCode: 12345678,
        phone: '11987654322',
        email: 'ana.costa@example.com',
      },
    })

    const recipient2 = await prisma.recipient.create({
      data: {
        name: 'Lucas Pereira',
        street: 'Rua Augusta',
        number: 456,
        neighborhood: 'Consolação',
        city: 'São Paulo',
        state: 'SP',
        zipCode: 87654321,
        phone: '11987654323',
        email: 'lucas.pereira@example.com',
      },
    })

    const recipientInactive = await prisma.recipient.create({
      data: {
        name: 'Inactive Recipient',
        street: 'Rua Inativa',
        number: 789,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: 11122233,
        phone: '11987654324',
        email: 'inactive@example.com',
      },
    })

    return { admin, recipient1, recipient2, recipientInactive }
  }

  it('[GET] /recipients - should return a list of recipients for an active admin', async () => {
    const { admin, recipient1, recipient2, recipientInactive } =
      await seedAdminAndRecipients()

    const token = jwtService.sign({ sub: admin.id })

    const response = await request(app.getHttpServer())
      .get('/recipients')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', admin.id)
      .query({ page: 1 })

    expect(response.status).toBe(HttpStatus.OK)
    expect(response.body.recipients).toEqual(
      expect.arrayContaining([
        {
          id: recipient1.id,
          name: 'Ana Costa',
          street: 'Avenida Paulista',
          number: 123,
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          zipCode: 12345678,
          phone: '11987654322',
          email: 'ana.costa@example.com',
        },
        {
          id: recipient2.id,
          name: 'Lucas Pereira',
          street: 'Rua Augusta',
          number: 456,
          neighborhood: 'Consolação',
          city: 'São Paulo',
          state: 'SP',
          zipCode: 87654321,
          phone: '11987654323',
          email: 'lucas.pereira@example.com',
        },
        {
          id: recipientInactive.id,
          name: 'Inactive Recipient',
          street: 'Rua Inativa',
          number: 789,
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: 11122233,
          phone: '11987654324',
          email: 'inactive@example.com',
        },
      ]),
    )
    expect(response.body.recipients).toHaveLength(3)
  })

  it('[GET] /recipients - should return an empty array if no recipients exist', async () => {
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

    const token = jwtService.sign({ sub: admin.id })

    const response = await request(app.getHttpServer())
      .get('/recipients')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', admin.id)
      .query({ page: 1 })

    expect(response.status).toBe(HttpStatus.OK)
    expect(response.body).toEqual({ recipients: [] })
    expect(response.body.recipients).toHaveLength(0)
  })

  it('[GET] /recipients - should return 400 if page is invalid', async () => {
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        cpf: '12345678902',
        password: await hash('password', 8),
        role: 'admin',
        email: 'admin2@example.com',
        phone: '11987654321',
        status: 'active',
      },
    })

    const token = jwtService.sign({ sub: admin.id })

    const response = await request(app.getHttpServer())
      .get('/recipients')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', admin.id)
      .query({ page: 0 })

    expect(response.status).toBe(HttpStatus.BAD_REQUEST)
    expect(response.body.message).toContain('Validation failed')
  })

  it('[GET] /recipients - should return 403 if user is not an active admin', async () => {
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
      .get('/recipients')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', deliveryman.id)
      .query({ page: 1 })

    expect(response.status).toBe(HttpStatus.FORBIDDEN)
    expect(response.body.message).toContain(
      'Only active admins can list recipients',
    )
  })

  it('[GET] /recipients - should return 401 if not authenticated', async () => {
    const response = await request(app.getHttpServer())
      .get('/recipients')
      .set('Authorization', `Bearer xxxxxx`)
      .set('x-user-id', 'admin.id')
      .query({ page: 1 })

    expect(response.status).toBe(HttpStatus.FORBIDDEN)
    expect(response.body.message).toContain(
      'Only active admins can list recipients',
    )
  })

  afterAll(async () => {
    await prisma.user.deleteMany({})
    await prisma.recipient.deleteMany({})
    await app.close()
  })
})
