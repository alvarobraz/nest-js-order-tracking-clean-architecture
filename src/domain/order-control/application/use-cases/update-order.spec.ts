import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateOrderUseCase } from './update-order'
import { InMemoryOrdersRepository } from 'test/repositories/in-memory-orders-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeUser } from 'test/factories/make-users'
import { makeOrder } from 'test/factories/make-order'
import { left } from '@/core/either'

import { OrderNotFoundError } from './errors/order-not-found-error'
import { OnlyActiveAdminsCanUpdateOrdersError } from './errors/only-active-admins-can-update-orders-error'

let inMemoryOrdersRepository: InMemoryOrdersRepository
let inMemoryUsersRepository: InMemoryUsersRepository
let sut: UpdateOrderUseCase

describe('Update Order Use Case', () => {
  beforeEach(() => {
    inMemoryOrdersRepository = new InMemoryOrdersRepository()
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new UpdateOrderUseCase(
      inMemoryOrdersRepository,
      inMemoryUsersRepository,
    )
  })

  it('should update order street if admin is valid and active', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('admin-1'),
    )

    const order = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'Curitiba',
        state: 'PR',
        zipCode: '80010-000',
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      adminId: 'admin-1',
      orderId: 'order-1',
      street: 'Rua das Palmeiras',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      order: expect.objectContaining({
        id: new UniqueEntityID('order-1'),
        recipientId: new UniqueEntityID('recipient-1'),
        street: 'Rua das Palmeiras',
        number: '123',
        neighborhood: 'Centro',
        city: 'Curitiba',
        state: 'PR',
        zipCode: '80010-000',
      }),
    })
    expect(await inMemoryOrdersRepository.findById('order-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('order-1'),
        street: 'Rua das Palmeiras',
        number: '123',
      }),
    )
  })

  it('should update all order fields if admin is valid and active', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('admin-1'),
    )

    const order = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'Curitiba',
        state: 'PR',
        zipCode: '80010-000',
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      adminId: 'admin-1',
      orderId: 'order-1',
      recipientId: 'recipient-2',
      street: 'Rua das Palmeiras',
      number: '456',
      neighborhood: 'Batel',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-000',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      order: expect.objectContaining({
        id: new UniqueEntityID('order-1'),
        recipientId: new UniqueEntityID('recipient-2'),
        street: 'Rua das Palmeiras',
        number: '456',
        neighborhood: 'Batel',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-000',
      }),
    })
    expect(await inMemoryOrdersRepository.findById('order-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('order-1'),
        recipientId: new UniqueEntityID('recipient-2'),
        street: 'Rua das Palmeiras',
        number: '456',
        neighborhood: 'Batel',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-000',
      }),
    )
  })

  it('should return an error if admin does not exist', async () => {
    const order = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      adminId: 'admin-1',
      orderId: 'order-1',
      street: 'Rua das Palmeiras',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OnlyActiveAdminsCanUpdateOrdersError)
    expect(result).toEqual(left(new OnlyActiveAdminsCanUpdateOrdersError()))
    expect(await inMemoryOrdersRepository.findById('order-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('order-1'),
        street: expect.any(String), // Unchanged
      }),
    )
  })

  it('should return an error if admin is not an admin', async () => {
    const deliveryman = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    const order = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryUsersRepository.create(deliveryman)
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      adminId: 'deliveryman-1',
      orderId: 'order-1',
      street: 'Rua das Palmeiras',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OnlyActiveAdminsCanUpdateOrdersError)
    expect(result).toEqual(left(new OnlyActiveAdminsCanUpdateOrdersError()))
    expect(await inMemoryOrdersRepository.findById('order-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('order-1'),
        street: expect.any(String), // Unchanged
      }),
    )
  })

  it('should return an error if admin is inactive', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'inactive',
      },
      new UniqueEntityID('admin-1'),
    )

    const order = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      adminId: 'admin-1',
      orderId: 'order-1',
      street: 'Rua das Palmeiras',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OnlyActiveAdminsCanUpdateOrdersError)
    expect(result).toEqual(left(new OnlyActiveAdminsCanUpdateOrdersError()))
    expect(await inMemoryOrdersRepository.findById('order-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('order-1'),
        street: expect.any(String), // Unchanged
      }),
    )
  })

  it('should return an error if order does not exist', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('admin-1'),
    )

    await inMemoryUsersRepository.create(admin)

    const result = await sut.execute({
      adminId: 'admin-1',
      orderId: 'order-1',
      street: 'Rua das Palmeiras',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderNotFoundError)
    expect(result).toEqual(left(new OrderNotFoundError()))
    expect(await inMemoryOrdersRepository.findById('order-1')).toBeNull()
  })
})
