import { Test } from '@nestjs/testing'
import { INestApplication, HttpStatus } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { hash } from 'bcryptjs'

describe('Recipient By ID Controller (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    await app.init()
  })

  beforeEach(async () => {
    await prisma.user.deleteMany({})
    await prisma.recipient.deleteMany({})
  })

  async function seedAdminAndRecipient() {
    const admin = await prisma.user.create({
      data: {
        name: 'John Doe Admin',
        cpf: '12365478932',
        password: await hash('123456', 8),
        role: 'admin',
        email: 'admin@example.com',
        phone: '11987654321',
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

    const loginResponse = await request(app.getHttpServer())
      .post('/sessions')
      .send({
        cpf: '12365478932',
        password: '123456',
      })

    const accessToken = loginResponse.body.access_token
    return { admin, recipient, accessToken }
  }

  it('[GET] /recipients/:id - should return a recipient by ID', async () => {
    const { recipient, accessToken } = await seedAdminAndRecipient()

    const response = await request(app.getHttpServer())
      .get(`/recipients/${recipient.id}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(HttpStatus.OK)
    expect(response.body).toEqual({
      recipient: {
        id: recipient.id,
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
  })

  it('[GET] /recipients/:id - should return 400 if recipient not found', async () => {
    const { accessToken } = await seedAdminAndRecipient()

    const response = await request(app.getHttpServer())
      .get('/recipients/non-existent-id')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST)
    expect(response.body.message).toContain('Recipient not found')
  })

  it('[GET] /recipients/:id - should return 403 if user is not an active admin', async () => {
    const { recipient } = await seedAdminAndRecipient()

    await prisma.user.create({
      data: {
        name: 'Non Admin',
        cpf: '98765432100',
        password: await hash('123456', 8),
        role: 'deliveryman',
        email: 'nonadmin@example.com',
        phone: '11987654324',
        status: 'active',
      },
    })

    const loginResponse = await request(app.getHttpServer())
      .post('/sessions')
      .send({
        cpf: '98765432100',
        password: '123456',
      })

    const accessToken = loginResponse.body.access_token

    const response = await request(app.getHttpServer())
      .get(`/recipients/${recipient.id}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(HttpStatus.FORBIDDEN)
    expect(response.body.message).toContain(
      'Only active admins can list recipients',
    )
  })

  it('[GET] /recipients/:id - should return 401 if not authenticated', async () => {
    const { recipient } = await seedAdminAndRecipient()

    const response = await request(app.getHttpServer()).get(
      `/recipients/${recipient.id}`,
    )

    expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED)
    expect(response.body.message).toContain('Unauthorized')
  })

  afterAll(async () => {
    await prisma.user.deleteMany({})
    await prisma.recipient.deleteMany({})
    await app.close()
  })
})
