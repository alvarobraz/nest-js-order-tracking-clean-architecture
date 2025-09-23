import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import { hash } from 'bcryptjs'
import request from 'supertest'

describe('Create order (E2E)', () => {
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

  test('[POST] /orders', async () => {
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

    const orderOnDatabase = await prisma.order.findFirst({
      where: {
        recipientId: recipientOnDatabase?.id,
      },
    })

    expect(orderOnDatabase).toBeTruthy()
  })
})
