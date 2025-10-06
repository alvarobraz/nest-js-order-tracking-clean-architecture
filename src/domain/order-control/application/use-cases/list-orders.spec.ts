import { describe, it, expect, beforeEach } from 'vitest'
import { ListOrdersUseCase } from './list-orders'
import { InMemoryOrdersRepository } from 'test/repositories/in-memory-orders-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeUser } from 'test/factories/make-users'
import { makeOrder } from 'test/factories/make-order'
import { left } from '@/core/either'
import { OnlyActiveAdminsCanListOrdersError } from './errors/only-active-admins-can-list-orders-error'
import { InMemoryOrderAttachmentsRepository } from 'test/repositories/in-memory-order-attachments-repository'

let inMemoryOrderAttachmentsRepository: InMemoryOrderAttachmentsRepository
let inMemoryOrdersRepository: InMemoryOrdersRepository
let inMemoryUsersRepository: InMemoryUsersRepository
let sut: ListOrdersUseCase

describe('List Orders Use Case', () => {
  beforeEach(() => {
    inMemoryOrderAttachmentsRepository =
      new InMemoryOrderAttachmentsRepository()
    inMemoryOrdersRepository = new InMemoryOrdersRepository(
      inMemoryOrderAttachmentsRepository,
    )
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new ListOrdersUseCase(
      inMemoryOrdersRepository,
      inMemoryUsersRepository,
    )
  })

  it('should list orders if admin is valid and active', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('admin-1'),
    )

    const order1 = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
      },
      new UniqueEntityID('order-1'),
    )

    const order2 = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-2'),
      },
      new UniqueEntityID('order-2'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryOrdersRepository.create(order1)
    await inMemoryOrdersRepository.create(order2)

    const result = await sut.execute({ adminId: 'admin-1', page: 1 })

    expect(result.isRight()).toBe(true)
    expect(result.value).toBeInstanceOf(Array)
    expect(result.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: new UniqueEntityID('order-1'),
          recipientId: new UniqueEntityID('recipient-1'),
        }),
        expect.objectContaining({
          id: new UniqueEntityID('order-2'),
          recipientId: new UniqueEntityID('recipient-2'),
        }),
      ]),
    )
    expect(result.value).toHaveLength(2)
    expect(await inMemoryOrdersRepository.findAll({ page: 1 })).toHaveLength(2)
  })

  it('should return an empty array if no orders exist', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('admin-1'),
    )

    await inMemoryUsersRepository.create(admin)

    const result = await sut.execute({ adminId: 'admin-1', page: 1 })

    expect(result.isRight()).toBe(true)
    expect(result.value).toBeInstanceOf(Array)
    expect(result.value).toEqual([])
    expect(result.value).toHaveLength(0)
    expect(await inMemoryOrdersRepository.findAll({ page: 1 })).toHaveLength(0)
  })

  it('should return an error if admin does not exist', async () => {
    const result = await sut.execute({ adminId: 'admin-1', page: 1 })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OnlyActiveAdminsCanListOrdersError)
    expect(result).toEqual(left(new OnlyActiveAdminsCanListOrdersError()))
  })

  it('should return an error if admin is not an admin', async () => {
    const deliveryman = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    await inMemoryUsersRepository.create(deliveryman)

    const result = await sut.execute({ adminId: 'deliveryman-1', page: 1 })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OnlyActiveAdminsCanListOrdersError)
    expect(result).toEqual(left(new OnlyActiveAdminsCanListOrdersError()))
  })

  it('should return an error if admin is inactive', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'inactive',
      },
      new UniqueEntityID('admin-1'),
    )

    await inMemoryUsersRepository.create(admin)

    const result = await sut.execute({ adminId: 'admin-1', page: 1 })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OnlyActiveAdminsCanListOrdersError)
    expect(result).toEqual(left(new OnlyActiveAdminsCanListOrdersError()))
  })
})
