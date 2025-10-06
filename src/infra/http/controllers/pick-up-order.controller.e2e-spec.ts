import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, HttpStatus } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { hash } from 'bcryptjs'
import { DatabaseModule } from '@/infra/database/database.module'

describe('Pick Up Order Controller (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    await app.init()
  })

  beforeEach(async () => {
    await prisma.order.deleteMany({})
    await prisma.recipient.deleteMany({})
    await prisma.user.deleteMany({})
  })

  it('[PATCH] /order/pick-up/:orderId - should pick up an order if deliveryman is valid and active', async () => {
    const admin = await prisma.user.create({
      data: {
        name: 'John Doe',
        cpf: '12365478932',
        password: await hash('123456', 8),
        role: 'admin',
        email: 'johndoe@example.com',
        phone: '41997458547',
      },
    })

    const accessToken = jwt.sign({ sub: admin.id })

    const recipient = await request(app.getHttpServer())
      .post('/recipients')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        userId: admin.id,
        name: 'João Silva',
        street: 'Avenida Paulista',
        number: 123,
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipCode: 12345678,
        phone: '11987654321',
        email: 'joao.silva@email.com',
      })

    expect(recipient.statusCode).toBe(201)

    const recipientOnDatabase = await prisma.recipient.findFirst({
      where: {
        name: 'João Silva',
      },
    })

    const order = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: admin.id,
        recipientId: recipientOnDatabase?.id,
      })

    expect(order.statusCode).toBe(201)

    const response = await request(app.getHttpServer())
      .get('/orders?page=1')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-user-id', admin.id)

    const deliveryman = await prisma.user.create({
      data: {
        name: 'John Doe',
        cpf: '12345678901',
        password: await hash('password123', 8),
        role: 'deliveryman',
        email: 'john.doe@example.com',
        phone: '21999887766',
        status: 'active',
      },
    })

    const token = jwt.sign({ sub: deliveryman.id })

    const responsePickUpOrder = await request(app.getHttpServer())
      .patch(`/order/pick-up/${response.body.orders[0].id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(responsePickUpOrder.status).toBe(HttpStatus.OK)
    expect(responsePickUpOrder.body.order).toBeDefined()

    expect(responsePickUpOrder.body.order.deliverymanId).toBe(deliveryman.id)
    expect(responsePickUpOrder.body.order.recipient.name).toBe('João Silva')
    expect(responsePickUpOrder.body.order.status).toBe('picked_up')

    const orderInDb = await prisma.order.findUnique({
      where: { id: responsePickUpOrder.body.order.id },
      include: { recipient: true },
    })

    expect(orderInDb?.deliverymanId).toBe(deliveryman.id)
    expect(orderInDb?.recipient.name).toBe('João Silva')
    expect(orderInDb?.status).toBe('picked_up')
  })

  it('[PATCH] /order/pick-up/:orderId - should return 401 if no token is provided', async () => {
    const userRecipient = await prisma.user.create({
      data: {
        name: 'Fernanda Costa',
        cpf: '28274252039',
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
        street: 'Avenida das Américas',
        number: 456,
        neighborhood: 'Barra da Tijuca',
        city: 'Rio de Janeiro',
        state: 'RJ',
        zipCode: 22640002,
        phone: '21999887766',
        email: 'joao.silva@example.com',
      },
    })

    await prisma.order.create({
      data: {
        recipientId: recipient.id,
        status: 'pending',
        createdAt: new Date(),
      },
    })

    const response = await request(app.getHttpServer()).patch(
      '/order/pick-up/order-1',
    )

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
  })

  it('[PATCH] /order/pick-up/:orderId - should return 403 if user is not a deliveryman', async () => {
    const admin = await prisma.user.create({
      data: {
        name: 'John Doe',
        cpf: '12365478932',
        password: await hash('123456', 8),
        role: 'admin',
        email: 'johndoe@example.com',
        phone: '41997458547',
      },
    })

    const accessToken = jwt.sign({ sub: admin.id })

    const recipient = await request(app.getHttpServer())
      .post('/recipients')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        userId: admin.id,
        name: 'João Silva',
        street: 'Avenida Paulista',
        number: 123,
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipCode: 12345678,
        phone: '11987654321',
        email: 'joao.silva@email.com',
      })

    expect(recipient.statusCode).toBe(201)

    const recipientOnDatabase = await prisma.recipient.findFirst({
      where: {
        name: 'João Silva',
      },
    })

    const order = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: admin.id,
        recipientId: recipientOnDatabase?.id,
      })

    expect(order.statusCode).toBe(201)

    const response = await request(app.getHttpServer())
      .get('/orders?page=1')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-user-id', admin.id)

    const token = jwt.sign({ sub: admin.id })

    const responsePickUpOrder = await request(app.getHttpServer())
      .patch(`/order/pick-up/${response.body.orders[0].id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(responsePickUpOrder.status).toBe(HttpStatus.FORBIDDEN)
    expect(responsePickUpOrder.body.message).toBe(
      'Only active deliverymen can pick up orders',
    )
  })

  it('[PATCH] /order/pick-up/:orderId - should return 403 if deliveryman is inactive', async () => {
    const admin = await prisma.user.create({
      data: {
        name: 'John Doe',
        cpf: '12365478932',
        password: await hash('123456', 8),
        role: 'admin',
        email: 'johndoe@example.com',
        phone: '41997458547',
      },
    })

    const accessToken = jwt.sign({ sub: admin.id })

    const recipient = await request(app.getHttpServer())
      .post('/recipients')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        userId: admin.id,
        name: 'João Silva',
        street: 'Avenida Paulista',
        number: 123,
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipCode: 12345678,
        phone: '11987654321',
        email: 'joao.silva@email.com',
      })

    expect(recipient.statusCode).toBe(201)

    const recipientOnDatabase = await prisma.recipient.findFirst({
      where: {
        name: 'João Silva',
      },
    })

    const order = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: admin.id,
        recipientId: recipientOnDatabase?.id,
      })

    expect(order.statusCode).toBe(201)

    const response = await request(app.getHttpServer())
      .get('/orders?page=1')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-user-id', admin.id)

    const deliveryman = await prisma.user.create({
      data: {
        name: 'John Doe',
        cpf: '12345678901',
        password: await hash('password123', 8),
        role: 'deliveryman',
        email: 'john.doe@example.com',
        phone: '21999887766',
        status: 'inactive',
      },
    })

    const token = jwt.sign({ sub: deliveryman.id })

    const responsePickUpOrder = await request(app.getHttpServer())
      .patch(`/order/pick-up/${response.body.orders[0].id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(responsePickUpOrder.status).toBe(HttpStatus.FORBIDDEN)
    expect(responsePickUpOrder.body.message).toBe(
      'Only active deliverymen can pick up orders',
    )
  })

  it.skip('[PATCH] /order/pick-up/:orderId - should return 400 if order is not pending', async () => {
    const admin = await prisma.user.create({
      data: {
        name: 'John Doe',
        cpf: '12365478932',
        password: await hash('123456', 8),
        role: 'admin',
        email: 'johndoe@example.com',
        phone: '41997458547',
      },
    })

    const accessToken = jwt.sign({ sub: admin.id })

    const recipient = await request(app.getHttpServer())
      .post('/recipients')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        userId: admin.id,
        name: 'João Silva',
        street: 'Avenida Paulista',
        number: 123,
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipCode: 12345678,
        phone: '11987654321',
        email: 'joao.silva@email.com',
      })

    expect(recipient.statusCode).toBe(201)

    const recipientOnDatabase = await prisma.recipient.findFirst({
      where: {
        name: 'João Silva',
      },
    })

    const order = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: admin.id,
        recipientId: recipientOnDatabase?.id,
        status: 'delivered',
      })

    expect(order.statusCode).toBe(201)

    const response = await request(app.getHttpServer())
      .get('/orders?page=1')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-user-id', admin.id)

    const deliveryman = await prisma.user.create({
      data: {
        name: 'John Doe',
        cpf: '12345678901',
        password: await hash('password123', 8),
        role: 'deliveryman',
        email: 'john.doe@example.com',
        phone: '21999887766',
        status: 'inactive',
      },
    })

    const token = jwt.sign({ sub: deliveryman.id })

    const responsePickUpOrder = await request(app.getHttpServer())
      .patch(`/order/pick-up/${response.body.orders[0].id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(responsePickUpOrder.status).toBe(HttpStatus.OK)
    expect(responsePickUpOrder.body.order).toBeDefined()

    expect(responsePickUpOrder.body.order.deliverymanId).toBe(deliveryman.id)
    expect(responsePickUpOrder.body.order.recipient.name).toBe('João Silva')
    expect(responsePickUpOrder.body.order.status).toBe('picked_up')

    const res = await request(app.getHttpServer())
      .patch(`/order/pick-up/${response.body.orders[0].id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(HttpStatus.BAD_REQUEST)
    expect(res.body.message).toBe('Order must be pending to be picked up')
  })

  afterAll(async () => {
    await prisma.order.deleteMany({})
    await prisma.recipient.deleteMany({})
    await prisma.user.deleteMany({})
    await app.close()
  })
})
