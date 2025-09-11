import { Test } from '@nestjs/testing'
import { INestApplication, HttpStatus } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { hash } from 'bcryptjs'

describe('Deliverymen By ID Controller (e2e)', () => {
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
  })

  async function seedAdminAndDeliveryman() {
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

    const deliveryman = await prisma.user.create({
      data: {
        name: 'Maria Silva',
        cpf: '12345678901',
        password: await hash('Abcd1234@', 8),
        role: 'deliveryman',
        email: 'maria@example.com',
        phone: '11987654322',
        status: 'active',
      },
    })

    const loginResponse = await request(app.getHttpServer())
      .post('/sessions')
      .send({
        cpf: '12365478932',
        password: '123456',
      })

    const accessToken = loginResponse.body.access_token
    return { admin, deliveryman, accessToken }
  }

  it('[GET] /users/:id - should return a deliveryman by ID', async () => {
    const { deliveryman, accessToken } = await seedAdminAndDeliveryman()

    const response = await request(app.getHttpServer())
      .get(`/users/${deliveryman.id}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(HttpStatus.OK)
    expect(response.body).toEqual({
      user: {
        id: deliveryman.id,
        name: 'Maria Silva',
        cpf: '12345678901',
        email: 'maria@example.com',
        phone: '11987654322',
        role: 'deliveryman',
        status: 'active',
      },
    })
  })

  it('[GET] /users/:id - should return 400 if deliveryman not found', async () => {
    const { accessToken } = await seedAdminAndDeliveryman()

    const response = await request(app.getHttpServer())
      .get('/users/non-existent-id')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST)
    expect(response.body.message).toContain('Active deliveryman not found')
  })

  it('[GET] /users/:id - should return 403 if user is not an active admin', async () => {
    const { deliveryman } = await seedAdminAndDeliveryman()

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
      .get(`/users/${deliveryman.id}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(HttpStatus.FORBIDDEN)
    expect(response.body.message).toContain(
      'Only active admins can list deliverymen',
    )
  })

  it('[GET] /users/:id - should return 401 if not authenticated', async () => {
    const { deliveryman } = await seedAdminAndDeliveryman()

    const response = await request(app.getHttpServer()).get(
      `/users/${deliveryman.id}`,
    )

    expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED)
    expect(response.body.message).toContain('Unauthorized')
  })

  afterAll(async () => {
    await prisma.user.deleteMany({})
    await app.close()
  })
})
