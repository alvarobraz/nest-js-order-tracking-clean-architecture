import { Test } from '@nestjs/testing'
import { INestApplication, HttpStatus } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { hash } from 'bcryptjs'

describe('Create User Recipient Controller (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let usersRepository: UsersRepository

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    usersRepository = moduleRef.get(UsersRepository)
    await app.init()
  })

  beforeEach(async () => {
    await prisma.user.deleteMany({})
  })

  it('[POST] /user-recipient - should create a new recipient user', async () => {
    const response = await request(app.getHttpServer())
      .post('/user-recipient')
      .send({
        name: 'Mariana Oliveira',
        cpf: '49265649046',
        password: 'Abcd1234@',
        email: 'mariana.oliveira@example.com',
        phone: '41999887766',
      })

    expect(response.statusCode).toBe(HttpStatus.CREATED)

    const userOnDatabase = await usersRepository.findByCpf('49265649046')
    expect(userOnDatabase).toBeTruthy()
    expect(userOnDatabase).toMatchObject({
      name: 'Mariana Oliveira',
      cpf: '49265649046',
      email: 'mariana.oliveira@example.com',
      phone: '41999887766',
      role: 'recipient',
      status: 'active',
    })
  })

  it('[POST] /user-recipient - should return 409 if cpf is already in use', async () => {
    await prisma.user.create({
      data: {
        name: 'Existing User',
        cpf: '49265649046',
        password: await hash('Abcd1234@', 8),
        role: 'recipient',
        email: 'existing@example.com',
        phone: '41997458547',
      },
    })

    const response = await request(app.getHttpServer())
      .post('/user-recipient')
      .send({
        name: 'Mariana Oliveira',
        cpf: '49265649046',
        password: 'Abcd1234@',
        email: 'mariana.oliveira@example.com',
        phone: '41999887766',
      })

    expect(response.statusCode).toBe(HttpStatus.CONFLICT)
    expect(response.body.message).toContain(
      'User with same cpf address already exists.',
    )
  })

  it('[POST] /user-recipient - should return 409 if email is already in use', async () => {
    await prisma.user.create({
      data: {
        name: 'Existing User',
        cpf: '12345678901',
        password: await hash('Abcd1234@', 8),
        role: 'recipient',
        email: 'mariana.oliveira@example.com',
        phone: '41997458547',
      },
    })

    const response = await request(app.getHttpServer())
      .post('/user-recipient')
      .send({
        name: 'Mariana Oliveira',
        cpf: '49265649046',
        password: 'Abcd1234@',
        email: 'mariana.oliveira@example.com',
        phone: '41999887766',
      })

    expect(response.statusCode).toBe(HttpStatus.CONFLICT)
    expect(response.body.message).toContain(
      'User with same email address already exists.',
    )
  })

  afterAll(async () => {
    await prisma.user.deleteMany({})
    await app.close()
  })
})
