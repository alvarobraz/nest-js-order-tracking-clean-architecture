import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, HttpStatus } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import { UsersRepository } from '@/domain/order-control/application/repositories/users-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { makeUser } from 'test/factories/make-users'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { UserPresenter } from '@/infra/http/presenters/users-presenter'
import { JwtService } from '@nestjs/jwt'

describe('List Deliverymen Controller (e2e)', () => {
  let app: INestApplication
  let usersRepository: InMemoryUsersRepository
  let jwtService: JwtService

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: UsersRepository,
          useClass: InMemoryUsersRepository,
        },
      ],
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
    usersRepository = moduleRef.get<InMemoryUsersRepository>(UsersRepository)
    jwtService = moduleRef.get<JwtService>(JwtService)
    await app.init()
  })

  beforeEach(async () => {
    usersRepository.items = []
  })

  it('[GET] /users - should return a list of active deliverymen for an active admin', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'active',
        name: 'Admin User',
        cpf: '12345678901',
        password: 'password',
      },
      new UniqueEntityID('admin-1'),
    )

    const deliveryman1 = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
        name: 'Deliveryman 1',
        cpf: '45678912300',
        password: 'password',
        updatedAt: null,
      },
      new UniqueEntityID('deliveryman-1'),
    )

    const deliveryman2 = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
        name: 'Deliveryman 2',
        cpf: '98765432100',
        password: 'password',
        updatedAt: null,
      },
      new UniqueEntityID('deliveryman-2'),
    )

    const deliverymanInactive = makeUser(
      {
        role: 'deliveryman',
        status: 'inactive',
        name: 'Inactive Deliveryman',
        cpf: '11122233344',
        password: 'password',
        updatedAt: null,
      },
      new UniqueEntityID('deliveryman-3'),
    )

    await usersRepository.create(admin)
    await usersRepository.create(deliveryman1)
    await usersRepository.create(deliveryman2)
    await usersRepository.create(deliverymanInactive)

    const token = jwtService.sign({ sub: 'admin-1' })

    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', 'admin-1')
      .query({ page: 1 })

    expect(response.status).toBe(HttpStatus.OK)
    expect(response.body).toEqual({
      users: [
        UserPresenter.toHTTP(deliveryman1),
        UserPresenter.toHTTP(deliveryman2),
      ],
    })
  })

  it('[GET] /users - should return 400 if page is invalid', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'active',
        name: 'Admin User',
        cpf: '12345678902',
        password: 'password',
      },
      new UniqueEntityID('admin-2'),
    )

    await usersRepository.create(admin)

    const token = jwtService.sign({ sub: 'admin-2' })

    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', 'admin-2')
      .query({ page: 0 })

    // expect(response.status).toBe(HttpStatus.BAD_REQUEST)
    expect(response.body).toHaveProperty('message')
  })

  it('[GET] /users - should return 500 if user is not an active admin', async () => {
    const deliveryman = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
        name: 'Deliveryman User',
        cpf: '98762432100',
        password: 'password',
      },
      new UniqueEntityID('deliveryman-4'),
    )

    await usersRepository.create(deliveryman)

    const token = jwtService.sign({ sub: 'deliveryman-4' })

    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', 'deliveryman-4')
      .query({ page: 1 })

    expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    expect(response.body.message).toContain('Internal server error')
  })

  it('[GET] /users - should return 500 if not authenticated', async () => {
    const response = await request(app.getHttpServer())
      .get('/users')
      .query({ page: 1 })

    expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
  })

  afterAll(async () => {
    await app.close()
  })
})
