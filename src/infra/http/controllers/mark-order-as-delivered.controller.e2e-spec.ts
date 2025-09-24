import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, HttpStatus } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { hash } from 'bcryptjs'
import { DatabaseModule } from '@/infra/database/database.module'

describe('Mark Order As Delivered Controller (e2e)', () => {
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

  it('[PUT] /order/mark-as-delivered/:orderId - should mark an order as delivered if deliveryman is valid and active', async () => {
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
        email: 'joao.silva@email.com',
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

    const responseAttachment1 = await prisma.attachment.create({
      data: {
        title: 'photo-1',
        url: 'uuid-photo-1',
      },
    })

    const responseAttachment2 = await prisma.attachment.create({
      data: {
        title: 'photo-2',
        url: 'uuid-photo-2',
      },
    })

    const response = await request(app.getHttpServer())
      .put(`/order/mark-as-delivered/${ordersResponse.body.orders[0].id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        deliveryPhotoIds: [responseAttachment1.id, responseAttachment2.id],
      })

    expect(response.status).toBe(HttpStatus.OK)
    expect(response.body.order).toBeDefined()
    expect(response.body.order).toEqual(
      expect.objectContaining({
        id: ordersResponse.body.orders[0].id,
        deliverymanId: deliveryman.id,
        recipientId: recipientOnDatabase?.id,
        status: 'delivered',
        recipient: expect.objectContaining({
          name: 'João Silva',
        }),
        deliveryPhoto: expect.arrayContaining([
          expect.objectContaining({
            id: responseAttachment1.id,
            orderId: ordersResponse.body.orders[0].id,
          }),
          expect.objectContaining({
            id: responseAttachment2.id,
            orderId: ordersResponse.body.orders[0].id,
          }),
        ]),
      }),
    )

    const orderInDb = await prisma.order.findUnique({
      where: { id: ordersResponse.body.orders[0].id },
      include: { recipient: true, attachments: true },
    })

    expect(orderInDb).toEqual(
      expect.objectContaining({
        id: ordersResponse.body.orders[0].id,
        deliverymanId: deliveryman.id,
        recipientId: recipientOnDatabase?.id,
        status: 'delivered',
      }),
    )
    expect(orderInDb?.attachments).toHaveLength(2)
    expect(orderInDb?.attachments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: responseAttachment1.id,
          orderId: ordersResponse.body.orders[0].id,
        }),
        expect.objectContaining({
          id: responseAttachment2.id,
          orderId: ordersResponse.body.orders[0].id,
        }),
      ]),
    )
  })

  it('[PUT] /order/mark-as-delivered/:orderId - should return 401 if no token is provided', async () => {
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
        email: 'joao.silva@email.com',
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

    const responseAttachment1 = await prisma.attachment.create({
      data: {
        title: 'photo-1',
        url: 'uuid-photo-1',
      },
    })

    const responseAttachment2 = await prisma.attachment.create({
      data: {
        title: 'photo-2',
        url: 'uuid-photo-2',
      },
    })

    const response = await request(app.getHttpServer())
      .put(`/order/mark-as-delivered/${ordersResponse.body.orders[0].id}`)
      .set('Authorization', `Bearer `)
      .send({
        deliveryPhotoIds: [responseAttachment1.id, responseAttachment2.id],
      })

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
  })

  it('[PUT] /order/mark-as-delivered/:orderId - should return 403 if user is not a deliveryman', async () => {
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
        email: 'joao.silva@email.com',
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

    const responseAttachment1 = await prisma.attachment.create({
      data: {
        title: 'photo-1',
        url: 'uuid-photo-1',
      },
    })

    const responseAttachment2 = await prisma.attachment.create({
      data: {
        title: 'photo-2',
        url: 'uuid-photo-2',
      },
    })

    const response = await request(app.getHttpServer())
      .put(`/order/mark-as-delivered/${ordersResponse.body.orders[0].id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        deliveryPhotoIds: [responseAttachment1.id, responseAttachment2.id],
      })

    expect(response.status).toBe(HttpStatus.FORBIDDEN)
    expect(response.body.message).toBe(
      'Only active deliverymen can mark orders as delivered',
    )
  })

  it('[PUT] /order/mark-as-delivered/:orderId - should return 403 if deliveryman is not assigned to the order', async () => {
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
        email: 'joao.silva@email.com',
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
        name: 'Jane three',
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

    const responseAttachment1 = await prisma.attachment.create({
      data: {
        title: 'photo-1',
        url: 'uuid-photo-1',
      },
    })

    const responseAttachment2 = await prisma.attachment.create({
      data: {
        title: 'photo-2',
        url: 'uuid-photo-2',
      },
    })

    const response = await request(app.getHttpServer())
      .put(`/order/mark-as-delivered/${ordersResponse.body.orders[0].id}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({
        deliveryPhotoIds: [responseAttachment1.id, responseAttachment2.id],
      })

    expect(response.status).toBe(HttpStatus.FORBIDDEN)
    expect(response.body.message).toBe(
      'Only the assigned deliveryman can mark the order as delivered',
    )
  })

  it('[PUT] /order/mark-as-delivered/:orderId - should return 400 if order is not picked up', async () => {
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
        email: 'joao.silva@email.com',
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

    const responseAttachment1 = await prisma.attachment.create({
      data: {
        title: 'photo-1',
        url: 'uuid-photo-1',
      },
    })

    const responseAttachment2 = await prisma.attachment.create({
      data: {
        title: 'photo-2',
        url: 'uuid-photo-2',
      },
    })

    const response = await request(app.getHttpServer())
      .put(`/order/mark-as-delivered/${ordersResponse.body.orders[0].id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        deliveryPhotoIds: [responseAttachment1.id, responseAttachment2.id],
      })

    expect(response.status).toBe(HttpStatus.FORBIDDEN)
    expect(response.body.message).toBe(
      'Only the assigned deliveryman can mark the order as delivered',
    )
  })

  it('[PUT] /order/mark-as-delivered/:orderId - should return 400 if no delivery photos are provided', async () => {
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
        email: 'joao.silva@email.com',
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
      .put(`/order/mark-as-delivered/${ordersResponse.body.orders[0].id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        deliveryPhotoIds: [],
      })

    expect(response.status).toBe(HttpStatus.BAD_REQUEST)
    expect(response.body.message).toBe('Validation failed')
  })

  afterAll(async () => {
    await prisma.attachment.deleteMany({})
    await prisma.order.deleteMany({})
    await prisma.recipient.deleteMany({})
    await prisma.user.deleteMany({})
    await app.close()
  })
})
