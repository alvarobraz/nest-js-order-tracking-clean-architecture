import { describe, it, expect, beforeEach } from 'vitest'
import { ListUserDeliveriesUseCase } from './list-user-deliveries'
import { InMemoryOrdersRepository } from 'test/repositories/in-memory-orders-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeUser } from 'test/factories/make-users'
import { makeOrder } from 'test/factories/make-order'
import { left } from '@/core/either'

import { UserNotFoundError } from './errors/user-not-found-error'
import { OnlyActiveAdminsCanListDeliverymenError } from './errors/only-active-admins-can-list-deliverymen-error'
import { UserNotDeliverymanError } from './errors/user-not-deliveryman-error'

let inMemoryOrdersRepository: InMemoryOrdersRepository
let inMemoryUsersRepository: InMemoryUsersRepository
let sut: ListUserDeliveriesUseCase

describe('List User Deliveries Use Case', () => {
  beforeEach(() => {
    inMemoryOrdersRepository = new InMemoryOrdersRepository()
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new ListUserDeliveriesUseCase(
      inMemoryOrdersRepository,
      inMemoryUsersRepository,
    )
  })

  it('should list deliveries for a deliveryman if admin is valid and active', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('admin-1'),
    )

    const deliveryman = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
        name: 'João Silva',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    const order1 = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
        deliverymanId: new UniqueEntityID('deliveryman-1'),
      },
      new UniqueEntityID('order-1'),
    )

    const order2 = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-2'),
        deliverymanId: new UniqueEntityID('deliveryman-1'),
      },
      new UniqueEntityID('order-2'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryUsersRepository.create(deliveryman)
    await inMemoryOrdersRepository.create(order1)
    await inMemoryOrdersRepository.create(order2)

    const result = await sut.execute({
      adminId: 'admin-1',
      userId: 'deliveryman-1',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toBeInstanceOf(Array)
    expect(result.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: new UniqueEntityID('order-1'),
          recipientId: new UniqueEntityID('recipient-1'),
          deliverymanId: new UniqueEntityID('deliveryman-1'),
        }),
        expect.objectContaining({
          id: new UniqueEntityID('order-2'),
          recipientId: new UniqueEntityID('recipient-2'),
          deliverymanId: new UniqueEntityID('deliveryman-1'),
        }),
      ]),
    )
    expect(result.value).toHaveLength(2)
    expect(
      await inMemoryOrdersRepository.findByDeliverymanId('deliveryman-1'),
    ).toHaveLength(2)
  })

  it('should return an empty array if no deliveries exist for the deliveryman', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('admin-1'),
    )

    const deliveryman = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
        name: 'João Silva',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryUsersRepository.create(deliveryman)

    const result = await sut.execute({
      adminId: 'admin-1',
      userId: 'deliveryman-1',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toBeInstanceOf(Array)
    expect(result.value).toEqual([])
    expect(result.value).toHaveLength(0)
    expect(
      await inMemoryOrdersRepository.findByDeliverymanId('deliveryman-1'),
    ).toHaveLength(0)
  })

  it('should return an error if admin does not exist', async () => {
    const deliveryman = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    await inMemoryUsersRepository.create(deliveryman)

    const result = await sut.execute({
      adminId: 'admin-1',
      userId: 'deliveryman-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OnlyActiveAdminsCanListDeliverymenError)
    expect(result).toEqual(left(new OnlyActiveAdminsCanListDeliverymenError()))
  })

  it('should return an error if admin is not an admin', async () => {
    const deliveryman1 = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    const deliveryman2 = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
      },
      new UniqueEntityID('deliveryman-2'),
    )

    await inMemoryUsersRepository.create(deliveryman1)
    await inMemoryUsersRepository.create(deliveryman2)

    const result = await sut.execute({
      adminId: 'deliveryman-1',
      userId: 'deliveryman-2',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OnlyActiveAdminsCanListDeliverymenError)
    expect(result).toEqual(left(new OnlyActiveAdminsCanListDeliverymenError()))
  })

  it('should return an error if admin is inactive', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'inactive',
      },
      new UniqueEntityID('admin-1'),
    )

    const deliveryman = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryUsersRepository.create(deliveryman)

    const result = await sut.execute({
      adminId: 'admin-1',
      userId: 'deliveryman-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OnlyActiveAdminsCanListDeliverymenError)
    expect(result).toEqual(left(new OnlyActiveAdminsCanListDeliverymenError()))
  })

  it('should return an error if user does not exist', async () => {
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
      userId: 'deliveryman-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UserNotFoundError)
    expect(result).toEqual(left(new UserNotFoundError()))
  })

  it('should return an error if user is not a deliveryman', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('admin-1'),
    )

    const user = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('user-1'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryUsersRepository.create(user)

    const result = await sut.execute({
      adminId: 'admin-1',
      userId: 'user-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UserNotDeliverymanError)
    expect(result).toEqual(left(new UserNotDeliverymanError()))
  })
})
