import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, HttpStatus } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { hash } from 'bcryptjs'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'

describe('Delete Recipient Controller (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwtService: JwtService

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          const request = context.switchToHttp().getRequest()
          request.user = { sub: request.headers['x-user-id'] }
          return true
        },
      })
      .compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    jwtService = moduleRef.get<JwtService>(JwtService)
    await app.init()
  })

  beforeEach(async () => {
    await prisma.user.deleteMany({})
    await prisma.recipient.deleteMany({})
  })

  async function seedAdminAndRecipient() {
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        cpf: '12345678901',
        password: await hash('password', 8),
        role: 'admin',
        email: 'admin@example.com',
        phone: '11987654321',
        status: 'active',
      },
    })

    const recipient = await prisma.recipient.create({
      data: {
        name: 'João Silva',
        street: 'Avenida Paulista',
        number: 123,
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipCode: 12345678,
        phone: '11987654322',
        email: 'joao.silva@example.com',
      },
    })

    return { admin, recipient }
  }

  it('[DELETE] /recipients/:id - should delete a recipient for an active admin', async () => {
    const { admin, recipient } = await seedAdminAndRecipient()

    const token = jwtService.sign({ sub: admin.id })

    const response = await request(app.getHttpServer())
      .delete(`/recipients/${recipient.id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', admin.id)

    expect(response.status).toBe(HttpStatus.NO_CONTENT)
    expect(response.body).toEqual({})

    const deletedRecipient = await prisma.recipient.findUnique({
      where: { id: recipient.id },
    })

    expect(deletedRecipient).toBeNull()
  })

  it('[DELETE] /recipients/:id - should return 400 if recipient does not exist', async () => {
    const { admin } = await seedAdminAndRecipient()

    const token = jwtService.sign({ sub: admin.id })

    const response = await request(app.getHttpServer())
      .delete('/recipients/non-existent-id')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', admin.id)

    expect(response.status).toBe(HttpStatus.BAD_REQUEST)
    expect(response.body.message).toContain('Recipient not found')
  })

  it('[DELETE] /recipients/:id - should return 403 if user is not an active admin', async () => {
    const { recipient } = await seedAdminAndRecipient()

    const deliveryman = await prisma.user.create({
      data: {
        name: 'Deliveryman User',
        cpf: '98765432100',
        password: await hash('password', 8),
        role: 'deliveryman',
        email: 'deliveryman@example.com',
        phone: '11987654324',
        status: 'active',
      },
    })

    const token = jwtService.sign({ sub: deliveryman.id })

    const response = await request(app.getHttpServer())
      .delete(`/recipients/${recipient.id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', deliveryman.id)

    expect(response.status).toBe(HttpStatus.FORBIDDEN)
    expect(response.body.message).toContain(
      'Only active admins can delete recipients',
    )
  })

  it('[DELETE] /recipients/:id - should return 403 if admin is inactive', async () => {
    const { recipient } = await seedAdminAndRecipient()

    const inactiveAdmin = await prisma.user.create({
      data: {
        name: 'Inactive Admin',
        cpf: '11122233344',
        password: await hash('password', 8),
        role: 'admin',
        email: 'inactive.admin@example.com',
        phone: '11987654325',
        status: 'inactive',
      },
    })

    const token = jwtService.sign({ sub: inactiveAdmin.id })

    const response = await request(app.getHttpServer())
      .delete(`/recipients/${recipient.id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', inactiveAdmin.id)

    expect(response.status).toBe(HttpStatus.FORBIDDEN)
    expect(response.body.message).toContain(
      'Only active admins can delete recipients',
    )
  })

  afterAll(async () => {
    await prisma.user.deleteMany({})
    await prisma.recipient.deleteMany({})
    await app.close()
  })
})
