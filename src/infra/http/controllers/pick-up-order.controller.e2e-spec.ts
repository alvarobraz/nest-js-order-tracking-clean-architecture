import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication, HttpStatus } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import { hash } from 'bcryptjs'
import request from 'supertest'

describe('Pick Up Order (E2E)', () => {
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

  async function createDeliverymanAndOrder() {
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        cpf: '11122233344',
        password: await hash('123456', 8),
        role: 'admin',
        email: 'admin@example.com',
        phone: '11999998888',
        status: 'active',
      },
    })

    const recipientUser = await prisma.user.create({
      data: {
        name: 'Carlos Souza',
        cpf: '99988877766',
        password: await hash('123456', 8),
        role: 'recipient',
        email: 'carlos.souza@example.com',
        phone: '11977776666',
        status: 'active',
      },
    })

    const recipientResponse = await request(app.getHttpServer())
      .post('/recipients')
      .set('Authorization', `Bearer ${jwt.sign({ sub: admin.id })}`)
      .send({
        userId: recipientUser.id,
        name: 'Carlos Souza',
        street: 'Rua das Flores',
        number: 100,
        neighborhood: 'Centro',
        city: 'Curitiba',
        state: 'PR',
        zipCode: 80000000,
        phone: '11977776666',
        email: 'carlos.souza@example.com',
      })

    expect(recipientResponse.statusCode).toBe(201)

    const recipientOnDatabase = await prisma.recipient.findFirst({
      where: { userId: recipientUser.id },
    })

    const order = await prisma.order.create({
      data: {
        recipientId: recipientOnDatabase!.id,
        status: 'pending',
      },
    })

    const deliveryman = await prisma.user.create({
      data: {
        name: 'João Entregador',
        cpf: '12312312399',
        password: await hash('123456', 8),
        role: 'deliveryman',
        email: 'joao.entregador@example.com',
        phone: '41997458547',
        status: 'active',
      },
    })

    const accessToken = jwt.sign({ sub: deliveryman.id })

    return {
      deliveryman,
      accessToken,
      order,
      recipientUser,
    }
  }

  it('[PATCH] /order/pick-up/:orderId - should pick up a pending order and send notification', async () => {
    const { accessToken, order, deliveryman, recipientUser } =
      await createDeliverymanAndOrder()

    const response = await request(app.getHttpServer())
      .patch(`/order/pick-up/${order.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    expect(response.statusCode).toBe(HttpStatus.OK)
    expect(response.body.order).toMatchObject({
      id: order.id,
      status: 'picked_up',
      deliverymanId: deliveryman.id,
    })

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
    })

    console.log('updatedOrder' + JSON.stringify(updatedOrder))

    expect(updatedOrder?.status).toBe('picked_up')

    const notification = await prisma.notification.findFirst({
      where: { recipientId: recipientUser.id },
      orderBy: { createdAt: 'desc' },
    })

    expect(notification).toBeTruthy()
    expect(notification).toMatchObject({
      recipientId: recipientUser.id,
      title: `Pedido "${order.id}" retirado`,
      content: `O pedido com destinatário "${recipientUser.id}" foi retirado e está com status "picked_up"`,
    })
  })

  it('[PATCH] /order/pick-up/:orderId - should return 404 if order not found', async () => {
    const { accessToken } = await createDeliverymanAndOrder()

    const response = await request(app.getHttpServer())
      .patch(`/order/pick-up/0195f49b-fa57-4697-b620-15eddfd94411`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    expect(response.statusCode).toBe(HttpStatus.NOT_FOUND)
    expect(response.body.message).toContain('Order not found')
  })

  it('[PATCH] /order/pick-up/:orderId - should return 403 if user is not an active deliveryman', async () => {
    const { order } = await createDeliverymanAndOrder()

    const nonDeliveryman = await prisma.user.create({
      data: {
        name: 'Maria Admin',
        cpf: '22211133355',
        password: await hash('123456', 8),
        role: 'admin',
        email: 'maria.admin@example.com',
        phone: '41999998888',
        status: 'active',
      },
    })

    const token = jwt.sign({ sub: nonDeliveryman.id })

    const response = await request(app.getHttpServer())
      .patch(`/order/pick-up/${order.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send()

    expect(response.statusCode).toBe(HttpStatus.FORBIDDEN)
    expect(response.body.message).toContain(
      'Only active deliverymen can pick up orders',
    )
  })

  it('[PATCH] /order/pick-up/:orderId - should return 400 if order is not pending', async () => {
    const { accessToken, order } = await createDeliverymanAndOrder()

    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'delivered' },
    })

    const response = await request(app.getHttpServer())
      .patch(`/order/pick-up/${order.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST)
    expect(response.body.message).toContain(
      'Order must be pending to be picked up',
    )
  })

  it('[PATCH] /order/pick-up/:orderId - should return 401 if user is not authenticated', async () => {
    const { order } = await createDeliverymanAndOrder()

    const response = await request(app.getHttpServer())
      .patch(`/order/pick-up/${order.id}`)
      .send()

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
