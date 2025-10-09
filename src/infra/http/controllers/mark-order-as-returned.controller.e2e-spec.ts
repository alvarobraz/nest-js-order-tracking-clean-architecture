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
    await prisma.notification.deleteMany({})
    await prisma.order.deleteMany({})
    await prisma.recipient.deleteMany({})
    await prisma.user.deleteMany({})
  })

  it('[PATCH] /order/mark-as-returned/:orderId - should mark an order as returned if deliveryman is valid and active', async () => {
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
        cpf: '99988877766',
        password: await hash('123456', 8),
        role: 'recipient',
        email: 'joao.silva@example.com',
        phone: '11977776666',
        status: 'active',
      },
    })

    const adminAccessToken = jwt.sign({ sub: admin.id })

    const recipientResponse = await request(app.getHttpServer())
      .post('/recipients')
      .set('Authorization', `Bearer ${adminAccessToken}`)
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
      where: { name: 'João Silva' },
    })

    const orderResponse = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        id: admin.id,
        recipientId: recipientOnDatabase?.id,
      })

    expect(orderResponse.statusCode).toBe(201)

    const ordersResponse = await request(app.getHttpServer())
      .get('/orders?page=1')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .set('x-user-id', admin.id)

    const deliveryman = await prisma.user.create({
      data: {
        name: 'Jane Doe',
        cpf: '12345678901',
        password: await hash('password123', 8),
        role: 'deliveryman',
        email: 'jane.doe@example.com',
        phone: '21999887766',
        status: 'active',
      },
    })

    const token = jwt.sign({ sub: deliveryman.id })

    const pickUpResponse = await request(app.getHttpServer())
      .patch(`/order/pick-up/${ordersResponse.body.orders[0].id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(pickUpResponse.status).toBe(HttpStatus.OK)

    const response = await request(app.getHttpServer())
      .patch(`/order/mark-as-returned/${ordersResponse.body.orders[0].id}`)
      .set('Authorization', `Bearer ${token}`)
      .send()

    expect(response.status).toBe(HttpStatus.OK)
    expect(response.body.order).toBeDefined()
    expect(response.body.order).toEqual(
      expect.objectContaining({
        id: ordersResponse.body.orders[0].id,
        deliverymanId: deliveryman.id,
        recipientId: recipientOnDatabase?.id,
        status: 'returned',
        recipient: expect.objectContaining({
          name: 'João Silva',
        }),
      }),
    )

    const orderInDb = await prisma.order.findUnique({
      where: { id: ordersResponse.body.orders[0].id },
      include: { recipient: true },
    })

    expect(orderInDb).toEqual(
      expect.objectContaining({
        id: ordersResponse.body.orders[0].id,
        deliverymanId: deliveryman.id,
        recipientId: recipientOnDatabase?.id,
        status: 'returned',
      }),
    )

    const notifications = await prisma.notification.findMany({
      where: { recipientId: recipientUser.id },
      orderBy: { createdAt: 'desc' },
    })

    expect(notifications).toHaveLength(3)
    expect(notifications[0]).toMatchObject({
      recipientId: recipientUser.id,
      title: `Pedido com número "${ordersResponse.body.orders[0].id}" retornado`,
      content: `O pedido com número "${ordersResponse.body.orders[0].id}" foi retornado e está com status de "returned"`,
    })
  })

  it('[PATCH] /order/mark-as-returned/:orderId - should mark an order as returned if user is admin', async () => {
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
        cpf: '99988877766',
        password: await hash('123456', 8),
        role: 'recipient',
        email: 'joao.silva@example.com',
        phone: '11977776666',
        status: 'active',
      },
    })

    const adminAccessToken = jwt.sign({ sub: admin.id })

    const recipientResponse = await request(app.getHttpServer())
      .post('/recipients')
      .set('Authorization', `Bearer ${adminAccessToken}`)
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
      where: { name: 'João Silva' },
    })

    const orderResponse = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        id: admin.id,
        recipientId: recipientOnDatabase?.id,
      })

    expect(orderResponse.statusCode).toBe(201)

    const ordersResponse = await request(app.getHttpServer())
      .get('/orders?page=1')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .set('x-user-id', admin.id)

    const response = await request(app.getHttpServer())
      .patch(`/order/mark-as-returned/${ordersResponse.body.orders[0].id}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send()

    expect(response.status).toBe(HttpStatus.OK)
    expect(response.body.order).toBeDefined()
    expect(response.body.order).toEqual(
      expect.objectContaining({
        id: ordersResponse.body.orders[0].id,
        recipientId: recipientOnDatabase?.id,
        status: 'returned',
        recipient: expect.objectContaining({
          name: 'João Silva',
        }),
      }),
    )

    const orderInDb = await prisma.order.findUnique({
      where: { id: ordersResponse.body.orders[0].id },
      include: { recipient: true },
    })

    expect(orderInDb).toEqual(
      expect.objectContaining({
        id: ordersResponse.body.orders[0].id,
        recipientId: recipientOnDatabase?.id,
        status: 'returned',
      }),
    )

    const notifications = await prisma.notification.findMany({
      where: { recipientId: recipientUser.id },
      orderBy: { createdAt: 'desc' },
    })

    expect(notifications).toHaveLength(2)
    expect(notifications[0]).toMatchObject({
      recipientId: recipientUser.id,
      title: `Pedido com número "${ordersResponse.body.orders[0].id}" retornado`,
      content: `O pedido com número "${ordersResponse.body.orders[0].id}" foi retornado e está com status de "returned"`,
    })
  })

  it('[PATCH] /order/mark-as-returned/:orderId - should return 401 if no token is provided', async () => {
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
        cpf: '99988877766',
        password: await hash('123456', 8),
        role: 'recipient',
        email: 'joao.silva@example.com',
        phone: '11977776666',
        status: 'active',
      },
    })

    const adminAccessToken = jwt.sign({ sub: admin.id })

    const recipientResponse = await request(app.getHttpServer())
      .post('/recipients')
      .set('Authorization', `Bearer ${adminAccessToken}`)
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
      where: { name: 'João Silva' },
    })

    const orderResponse = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        id: admin.id,
        recipientId: recipientOnDatabase?.id,
      })

    expect(orderResponse.statusCode).toBe(201)

    const ordersResponse = await request(app.getHttpServer())
      .get('/orders?page=1')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .set('x-user-id', admin.id)

    const response = await request(app.getHttpServer())
      .patch(`/order/mark-as-returned/${ordersResponse.body.orders[0].id}`)
      .set('Authorization', `Bearer `)
      .send()

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
  })

  it('[PATCH] /order/mark-as-returned/:orderId - should return 403 if user is not active', async () => {
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
        cpf: '99988877766',
        password: await hash('123456', 8),
        role: 'recipient',
        email: 'joao.silva@example.com',
        phone: '11977776666',
        status: 'active',
      },
    })

    const adminAccessToken = jwt.sign({ sub: admin.id })

    const recipientResponse = await request(app.getHttpServer())
      .post('/recipients')
      .set('Authorization', `Bearer ${adminAccessToken}`)
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
      where: { name: 'João Silva' },
    })

    const orderResponse = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        id: admin.id,
        recipientId: recipientOnDatabase?.id,
      })

    expect(orderResponse.statusCode).toBe(201)

    const ordersResponse = await request(app.getHttpServer())
      .get('/orders?page=1')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .set('x-user-id', admin.id)

    const inactiveDeliveryman = await prisma.user.create({
      data: {
        name: 'Jane Doe',
        cpf: '12345678901',
        password: await hash('password123', 8),
        role: 'deliveryman',
        email: 'jane.doe@example.com',
        phone: '21999887766',
        status: 'inactive',
      },
    })

    const token = jwt.sign({ sub: inactiveDeliveryman.id })

    const pickUpResponse = await request(app.getHttpServer())
      .patch(`/order/pick-up/${ordersResponse.body.orders[0].id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(pickUpResponse.status).toBe(HttpStatus.FORBIDDEN)

    const response = await request(app.getHttpServer())
      .patch(`/order/mark-as-returned/${ordersResponse.body.orders[0].id}`)
      .set('Authorization', `Bearer ${token}`)
      .send()

    expect(response.status).toBe(HttpStatus.FORBIDDEN)
    expect(response.body.message).toBe(
      'Only active users can mark orders as returned',
    )
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
        status: 'active',
      },
    })

    const recipientUser = await prisma.user.create({
      data: {
        name: 'João Silva',
        cpf: '99988877766',
        password: await hash('123456', 8),
        role: 'recipient',
        email: 'joao.silva@example.com',
        phone: '11977776666',
        status: 'active',
      },
    })

    const adminAccessToken = jwt.sign({ sub: admin.id })

    const recipientResponse = await request(app.getHttpServer())
      .post('/recipients')
      .set('Authorization', `Bearer ${adminAccessToken}`)
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
      where: { name: 'João Silva' },
    })

    const orderResponse = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        id: admin.id,
        recipientId: recipientOnDatabase?.id,
      })

    expect(orderResponse.statusCode).toBe(201)

    const ordersResponse = await request(app.getHttpServer())
      .get('/orders?page=1')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .set('x-user-id', admin.id)

    const deliveryman = await prisma.user.create({
      data: {
        name: 'Jane Doe',
        cpf: '12345678901',
        password: await hash('password123', 8),
        role: 'deliveryman',
        email: 'jane.doe@example.com',
        phone: '21999887766',
        status: 'active',
      },
    })

    const deliveryman2 = await prisma.user.create({
      data: {
        name: 'Jane Three',
        cpf: '13345678901',
        password: await hash('password123', 8),
        role: 'deliveryman',
        email: 'jane.three@example.com',
        phone: '22999887766',
        status: 'active',
      },
    })

    const token = jwt.sign({ sub: deliveryman.id })
    const token2 = jwt.sign({ sub: deliveryman2.id })

    const pickUpResponse = await request(app.getHttpServer())
      .patch(`/order/pick-up/${ordersResponse.body.orders[0].id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(pickUpResponse.status).toBe(HttpStatus.OK)

    const response = await request(app.getHttpServer())
      .patch(`/order/mark-as-returned/${ordersResponse.body.orders[0].id}`)
      .set('Authorization', `Bearer ${token2}`)
      .send()

    expect(response.status).toBe(HttpStatus.FORBIDDEN)
    expect(response.body.message).toBe(
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

    const adminAccessToken = jwt.sign({ sub: admin.id })

    const response = await request(app.getHttpServer())
      .patch(`/order/mark-as-returned/0195f49b-fa57-4697-b620-15eddfd94411`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send()

    expect(response.status).toBe(HttpStatus.BAD_REQUEST)
    expect(response.body.message).toBe('Order not found')
  })

  afterAll(async () => {
    await prisma.notification.deleteMany({})
    await prisma.order.deleteMany({})
    await prisma.recipient.deleteMany({})
    await prisma.user.deleteMany({})
    await app.close()
  })
})
