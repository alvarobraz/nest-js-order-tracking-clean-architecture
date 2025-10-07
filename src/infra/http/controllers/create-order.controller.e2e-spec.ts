import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication, HttpStatus } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import { hash } from 'bcryptjs'
import request from 'supertest'

describe('Create Order (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  beforeEach(async () => {
    await prisma.notification.deleteMany({})
    await prisma.order.deleteMany({})
    await prisma.recipient.deleteMany({})
    await prisma.user.deleteMany({})
  })

  async function createAdminAndRecipient() {
    const admin = await prisma.user.create({
      data: {
        name: 'John Doe',
        cpf: '12365478932',
        password: await hash('123456', 8),
        role: 'admin',
        email: 'johndoe@example.com',
        phone: '41997458547',
        status: 'active',
      },
    })

    const recipientUser = await prisma.user.create({
      data: {
        name: 'João Silva',
        cpf: '98765432100',
        password: await hash('123456', 8),
        role: 'recipient',
        email: 'joao.silva@example.com',
        phone: '11987654321',
        status: 'active',
      },
    })

    const recipientResponse = await request(app.getHttpServer())
      .post('/recipients')
      .set('Authorization', `Bearer ${jwt.sign({ sub: admin.id })}`)
      .send({
        userId: recipientUser.id,
        name: 'João Silva',
        street: 'Avenida Paulista',
        number: 123,
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipCode: 12345678,
        phone: '11987654321',
        email: 'joao.silva@example.com',
      })

    expect(recipientResponse.statusCode).toBe(201)

    const recipientOnDatabase = await prisma.recipient.findFirst({
      where: { userId: recipientUser.id },
      orderBy: { createdAt: 'desc' },
    })

    return {
      admin,
      recipientUser,
      recipientId: recipientOnDatabase?.id,
      accessToken: jwt.sign({ sub: admin.id }),
    }
  }

  it('[POST] /orders - should create an order and send notification', async () => {
    const { accessToken, recipientId, recipientUser } =
      await createAdminAndRecipient()

    const response = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        recipientId,
      })

    expect(response.statusCode).toBe(HttpStatus.CREATED)
    expect(response.body.order).toMatchObject({
      id: expect.any(String),
      recipientId,
      status: 'pending',
    })

    const recipientOnDataBase2 = await prisma.recipient.findFirst({
      where: { id: response.body.order.recipientId },
      orderBy: { createdAt: 'desc' },
    })

    const notificationsOnDatabase = await prisma.notification.findFirst({
      where: { recipientId: recipientOnDataBase2?.userId },
      orderBy: { createdAt: 'desc' },
    })

    expect(notificationsOnDatabase).toBeTruthy()
    expect(notificationsOnDatabase).toMatchObject({
      recipientId: recipientUser.id,
      title: `Novo pedido criado "${response.body.order.id}"`,
      content: `O pedido com número "${response.body.order.id}" foi criado e está com status de "pending"`,
    })
  })

  it('[POST] /orders - should return 409 if recipient does not exist', async () => {
    const { accessToken } = await createAdminAndRecipient()

    const response = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        recipientId: 'non-existent-recipient',
      })

    expect(response.statusCode).toBe(HttpStatus.CONFLICT)
    expect(response.body.message).toContain('Recipient not found')
  })

  it('[POST] /orders - should return 500 if user is not an active admin', async () => {
    const { recipientId } = await createAdminAndRecipient()

    const nonAdmin = await prisma.user.create({
      data: {
        name: 'Jane Doe',
        cpf: '04534568763',
        password: await hash('123456', 8),
        role: 'deliveryman',
        email: 'jane.doe@example.com',
        phone: '41997458547',
        status: 'active',
      },
    })

    const nonAdminAccessToken = jwt.sign({ sub: nonAdmin.id })

    const response = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${nonAdminAccessToken}`)
      .send({
        recipientId,
      })

    expect(response.statusCode).toBe(HttpStatus.CONFLICT)
    expect(response.body.message).toContain(
      'Only active admins can create orders',
    )
  })

  it('[POST] /orders - should return 401 if not authenticated', async () => {
    const { recipientId } = await createAdminAndRecipient()

    const response = await request(app.getHttpServer()).post('/orders').send({
      recipientId,
    })

    expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED)
    expect(response.body.message).toContain('Unauthorized')
  })

  afterAll(async () => {
    await prisma.notification.deleteMany({})
    await prisma.order.deleteMany({})
    await prisma.recipient.deleteMany({})
    await prisma.user.deleteMany({})
    await app.close()
  })
})
