import { Test } from '@nestjs/testing'
import { INestApplication, HttpStatus } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { hash } from 'bcryptjs'

describe('Update Deliveryman Controller (e2e)', () => {
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

  it('[PUT] /users/:id - should update a deliveryman', async () => {
    const { deliveryman, accessToken } = await seedAdminAndDeliveryman()

    const response = await request(app.getHttpServer())
      .put(`/users/${deliveryman.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Maria Updated',
        email: 'maria.updated@example.com',
        phone: '11987654323',
        password: 'NewPass1234@',
      })

    expect(response.statusCode).toBe(HttpStatus.NO_CONTENT)

    const userOnDatabase = await prisma.user.findUnique({
      where: { id: deliveryman.id },
    })
    expect(userOnDatabase).toMatchObject({
      name: 'Maria Updated',
      email: 'maria.updated@example.com',
      phone: '11987654323',
    })
  })

  it('[PUT] /users/:id - should return 404 if deliveryman not found', async () => {
    const { accessToken } = await seedAdminAndDeliveryman()

    const response = await request(app.getHttpServer())
      .put('/users/non-existent-id')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Maria Updated',
        email: 'maria.updated@example.com',
        phone: '11987654323',
      })

    expect(response.statusCode).toBe(HttpStatus.NOT_FOUND)
    expect(response.body.message).toContain('Deliveryman not found')
  })

  it('[PUT] /users/:id - should return 400 if user is not an active admin', async () => {
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
      .put(`/users/${deliveryman.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Maria Updated',
        email: 'maria.updated@example.com',
        phone: '11987654323',
      })

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST)
    expect(response.body.message).toContain(
      'Only active admins can update deliverymen',
    )
  })

  it('[PUT] /users/:id - should return 401 if not authenticated', async () => {
    const { deliveryman } = await seedAdminAndDeliveryman()

    const response = await request(app.getHttpServer())
      .put(`/users/${deliveryman.id}`)
      .send({
        name: 'Maria Updated',
        email: 'maria.updated@example.com',
        phone: '11987654323',
      })

    expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED)
    expect(response.body.message).toContain('Unauthorized')
  })

  afterAll(async () => {
    await prisma.user.deleteMany({})
    await app.close()
  })
})
