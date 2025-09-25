import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, HttpStatus } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { hash } from 'bcryptjs'
import { DatabaseModule } from '@/infra/database/database.module'

describe('Mark Order As Returned Controller (e2e)', () => {
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
    await prisma.attachment.deleteMany({})
    await prisma.order.deleteMany({})
    await prisma.recipient.deleteMany({})
    await prisma.user.deleteMany({})
  })

  it('[PATCH] /order/mark-as-returned/:orderId - should mark an order as returned if admin is valid and active', async () => {
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

    const accessToken = jwt.sign({ sub: admin.id })

    const recipientResponse = await request(app.getHttpServer())
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
        email: 'joao.silva@example.com',
      })

    expect(recipientResponse.statusCode).toBe(201)

    const recipientOnDatabase = await prisma.recipient.findFirst({
      where: { name: 'João Silva' },
    })

    const orderResponse = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        id: admin.id,
        recipientId: recipientOnDatabase?.id,
      })

    expect(orderResponse.statusCode).toBe(201)

    const ordersResponse = await request(app.getHttpServer())
      .get('/orders?page=1')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-user-id', admin.id)

    const response = await request(app.getHttpServer())
      .patch(`/order/mark-as-returned/${ordersResponse.body.orders[0].id}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.status).toBe(HttpStatus.OK)
    expect(response.body.order).toEqual(
      expect.objectContaining({
        id: ordersResponse.body.orders[0].id,
        status: 'returned',
        recipient: expect.objectContaining({
          name: 'João Silva',
        }),
      }),
    )

    const orderInDb = await prisma.order.findUnique({
      where: { id: ordersResponse.body.orders[0].id },
    })

    expect(orderInDb).toEqual(
      expect.objectContaining({
        id: ordersResponse.body.orders[0].id,
        status: 'returned',
      }),
    )
  })

  it('[PATCH] /order/mark-as-returned/:orderId - should mark an order as returned if deliveryman is active and assigned', async () => {
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

    const ordersResponse = await request(app.getHttpServer())
      .get('/orders?page=1')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-user-id', admin.id)

    const responseReturned = await request(app.getHttpServer())
      .patch(`/order/mark-as-returned/${ordersResponse.body.orders[0].id}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(responseReturned.status).toBe(HttpStatus.OK)
    expect(responseReturned.body.order).toEqual(
      expect.objectContaining({
        id: ordersResponse.body.orders[0].id,
        status: 'returned',
        deliverymanId: deliveryman.id,
        recipient: expect.objectContaining({
          name: 'João Silva',
        }),
      }),
    )

    const orderInDb = await prisma.order.findUnique({
      where: { id: ordersResponse.body.orders[0].id },
    })

    expect(orderInDb).toEqual(
      expect.objectContaining({
        id: ordersResponse.body.orders[0].id,
        status: 'returned',
        deliverymanId: deliveryman.id,
      }),
    )
  })

  it('[PATCH] /order/mark-as-returned/:orderId - should return 401 if no token is provided', async () => {
    const response = await request(app.getHttpServer()).patch(
      '/order/mark-as-returned/order-1',
    )

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
  })

  it('[PATCH] /order/mark-as-returned/:orderId - should return 403 if deliveryman is not assigned to the order', async () => {
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

    const deliveryman2 = await prisma.user.create({
      data: {
        name: 'John Three',
        cpf: '13345678901',
        password: await hash('password123', 8),
        role: 'deliveryman',
        email: 'john.three@example.com',
        phone: '22999887766',
        status: 'active',
      },
    })

    const token2 = jwt.sign({ sub: deliveryman2.id })

    const responsePickUpOrder = await request(app.getHttpServer())
      .patch(`/order/pick-up/${response.body.orders[0].id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(responsePickUpOrder.status).toBe(HttpStatus.OK)
    expect(responsePickUpOrder.body.order).toBeDefined()

    const ordersResponse = await request(app.getHttpServer())
      .get('/orders?page=1')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-user-id', admin.id)

    const responseReturned = await request(app.getHttpServer())
      .patch(`/order/mark-as-returned/${ordersResponse.body.orders[0].id}`)
      .set('Authorization', `Bearer ${token2}`)

    expect(responseReturned.status).toBe(HttpStatus.FORBIDDEN)
    expect(responseReturned.body.message).toBe(
      'Only the assigned deliveryman or an admin can mark the order as returned',
    )
  })

  it('[PATCH] /order/mark-as-returned/:orderId - should return 400 if order is not found', async () => {
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

    const token = jwt.sign({ sub: admin.id })

    const response = await request(app.getHttpServer())
      .patch('/order/mark-as-returned/a2f22a5c-e3f4-4b79-8d0c-3045c635d2a4')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(HttpStatus.BAD_REQUEST)
    expect(response.body.message).toBe('Order not found')
  })

  afterAll(async () => {
    await prisma.attachment.deleteMany({})
    await prisma.order.deleteMany({})
    await prisma.recipient.deleteMany({})
    await prisma.user.deleteMany({})
    await app.close()
  })
})
