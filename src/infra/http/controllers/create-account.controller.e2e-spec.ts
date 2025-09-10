import { Test } from '@nestjs/testing'
import { INestApplication, HttpStatus } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { hash } from 'bcryptjs'

describe('Create Account Controller (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let usersRepository: UsersRepository

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    usersRepository = moduleRef.get(UsersRepository)
    await app.init()
  })

  beforeEach(async () => {
    await prisma.user.deleteMany({})
  })

  async function seedAdmin() {
    const admin = await prisma.user.create({
      data: {
        name: 'John Doe Admin',
        cpf: '12365478932',
        password: await hash('123456', 8),
        role: 'admin',
        email: 'admin@example.com',
        phone: '41997458547',
      },
    })

    const accessToken = jwt.sign({ sub: admin.id })
    return { accessToken }
  }

  it('[POST] /accounts - should create a new user for an active admin', async () => {
    const { accessToken } = await seedAdmin()

    const response = await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Maria Silva',
        cpf: '12345678901',
        password: 'Abcd1234@',
        email: 'mariasilva@example.com',
        phone: '11987654321',
      })

    expect(response.statusCode).toBe(HttpStatus.CREATED)

    const userOnDatabase = await usersRepository.findByCpf('12345678901')
    expect(userOnDatabase).toBeTruthy()
    expect(userOnDatabase).toMatchObject({
      name: 'Maria Silva',
      cpf: '12345678901',
      email: 'mariasilva@example.com',
      phone: '11987654321',
      role: 'deliveryman',
      status: 'active',
    })
  })

  it('[POST] /accounts - should return 409 user is not an active admin', async () => {
    const notAdmin = await prisma.user.create({
      data: {
        name: 'John Doe',
        cpf: '04534568763',
        password: await hash('123456', 8),
        role: 'deliveryman',
        email: 'sdfsdfsd@example.com',
        phone: '41997458547',
      },
    })

    const accessToken = jwt.sign({ sub: notAdmin.id })

    const response = await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Maria Silva',
        cpf: '12345678901',
        password: 'Abcd1234@',
        email: 'mariasilva@example.com',
        phone: '11987654321',
      })

    expect(response.statusCode).toBe(HttpStatus.CONFLICT)
    expect(response.body.message).toContain('User is not admin.')
  })

  it('[POST] /accounts - should return 409 if cpf is already in use', async () => {
    const { accessToken } = await seedAdmin()

    await prisma.user.create({
      data: {
        name: 'Existing User',
        cpf: '12345678901',
        password: await hash('Abcd1234@', 8),
        role: 'deliveryman',
        email: 'existing@example.com',
        phone: '41997458547',
      },
    })

    const response = await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Maria Silva',
        cpf: '12345678901',
        password: 'Abcd1234@',
        email: 'mariasilva@example.com',
        phone: '11987654321',
      })

    expect(response.statusCode).toBe(HttpStatus.CONFLICT)
    expect(response.body.message).toContain(
      'User with same cpf address already exists.',
    )
  })

  it('[POST] /accounts - should return 401 if not authenticated', async () => {
    const response = await request(app.getHttpServer()).post('/accounts').send({
      name: 'Maria Silva',
      cpf: '12345678901',
      password: 'Abcd1234@',
      email: 'mariasilva@example.com',
      phone: '11987654321',
    })

    expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED)
    expect(response.body.message).toContain('Unauthorized')
  })

  afterAll(async () => {
    await prisma.user.deleteMany({})
    await app.close()
  })
})
