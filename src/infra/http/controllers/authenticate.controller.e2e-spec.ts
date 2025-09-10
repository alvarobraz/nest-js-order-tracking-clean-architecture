import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { hash } from 'bcryptjs'
import request from 'supertest'

describe('Authenticate (E2E)', () => {
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

  it('[POST] /sessions - should authenticate a user with valid credentials', async () => {
    await prisma.user.create({
      data: {
        name: 'John Doe',
        cpf: '12365478932',
        password: await hash('123456', 8),
        email: 'johndoe@example.com',
        phone: '41997458547',
      },
    })

    const response = await request(app.getHttpServer()).post('/sessions').send({
      cpf: '12365478932',
      password: '123456',
    })

    expect(response.statusCode).toBe(201)
    expect(response.body).toEqual({
      access_token: expect.any(String),
    })
  })

  it('[POST] /sessions - should return 400 if CPF is invalid', async () => {
    await prisma.user.create({
      data: {
        name: 'John Doe',
        cpf: '99999999999',
        password: await hash('123456', 8),
        email: 'johndoe9@example.com',
        phone: '41997458547',
      },
    })

    const response = await request(app.getHttpServer()).post('/sessions').send({
      cpf: '049937373978',
      password: '123456',
    })

    expect(response.statusCode).toBe(400)
    expect(response.body.message).toContain('Validation failed')
  })

  it('[POST] /sessions - should return 401 if password is incorrect', async () => {
    await prisma.user.create({
      data: {
        name: 'John Doe',
        cpf: '49576749069',
        password: await hash('123456', 8),
        email: 'johndoe9@example.com',
        phone: '41997458547',
      },
    })

    const response = await request(app.getHttpServer()).post('/sessions').send({
      cpf: '49576749069',
      password: 'wrongpassword',
    })

    expect(response.statusCode).toBe(401)
    expect(response.body.message).toContain('Invalid credentials')
  })

  it('[POST] /sessions - should return 401 if user account is inactive', async () => {
    await prisma.user.create({
      data: {
        name: 'John Doe',
        cpf: '57458301074',
        password: await hash('123456', 8),
        email: 'johndoe9@example.com',
        phone: '41997458547',
        status: 'inactive',
      },
    })

    const response = await request(app.getHttpServer()).post('/sessions').send({
      cpf: '57458301074',
      password: '123456',
    })

    expect(response.statusCode).toBe(401)
    expect(response.body.message).toContain('User account is inactive')
  })

  it('[POST] /sessions - should not authenticate with formatted CPF', async () => {
    await prisma.user.create({
      data: {
        name: 'John Doe',
        cpf: '98712364096',
        password: await hash('123456', 8),
        email: 'johndoe9@example.com',
        phone: '41997458547',
        status: 'inactive',
      },
    })

    const response = await request(app.getHttpServer()).post('/sessions').send({
      cpf: '123.654.789-32',
      password: '123456',
    })

    expect(response.statusCode).toBe(400)
    expect(response.body.message).toContain('Validation failed')
  })
})
