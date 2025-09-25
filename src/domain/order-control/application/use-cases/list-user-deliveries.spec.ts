import { describe, it, expect, beforeEach } from 'vitest'
import { ListUserDeliveriesUseCase } from './list-user-deliveries'
import { InMemoryOrdersRepository } from 'test/repositories/in-memory-orders-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { InMemoryOrderAttachmentsRepository } from 'test/repositories/in-memory-order-attachments-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeUser } from 'test/factories/make-users'
import { makeOrder } from 'test/factories/make-order'
import { left } from '@/core/either'
import { OnlyActiveAdminsCanListDeliverymenError } from './errors/only-active-admins-can-list-deliverymen-error'
import { UserNotFoundError } from './errors/user-not-found-error'
import { UserNotDeliverymanError } from './errors/user-not-deliveryman-error'

let inMemoryOrdersRepository: InMemoryOrdersRepository
let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryOrderAttachmentsRepository: InMemoryOrderAttachmentsRepository
let sut: ListUserDeliveriesUseCase

describe('List User Deliveries Use Case', () => {
  beforeEach(() => {
    inMemoryOrderAttachmentsRepository =
      new InMemoryOrderAttachmentsRepository()
    inMemoryOrdersRepository = new InMemoryOrdersRepository(
      inMemoryOrderAttachmentsRepository,
    )
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new ListUserDeliveriesUseCase(
      inMemoryOrdersRepository,
      inMemoryUsersRepository,
    )
  })

  it('should list delivered orders for a deliveryman if admin is valid and active', async () => {
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
      },
      new UniqueEntityID('deliveryman-1'),
    )

    const order1 = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
        deliverymanId: new UniqueEntityID('deliveryman-1'),
        status: 'delivered',
      },
      new UniqueEntityID('order-1'),
    )

    const order2 = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
        deliverymanId: new UniqueEntityID('deliveryman-1'),
        status: 'pending',
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
    if (result.isRight()) {
      expect(result.value).toHaveLength(1)
      expect(result.value).toEqual([
        expect.objectContaining({
          id: new UniqueEntityID('order-1'),
          status: 'delivered',
          deliverymanId: new UniqueEntityID('deliveryman-1'),
        }),
      ])
    }
  })

  it('should list delivered orders for a deliveryman if requested by themselves', async () => {
    const deliveryman = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    const order1 = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
        deliverymanId: new UniqueEntityID('deliveryman-1'),
        status: 'delivered',
      },
      new UniqueEntityID('order-1'),
    )

    const order2 = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
        deliverymanId: new UniqueEntityID('deliveryman-1'),
        status: 'picked_up',
      },
      new UniqueEntityID('order-2'),
    )

    await inMemoryUsersRepository.create(deliveryman)
    await inMemoryOrdersRepository.create(order1)
    await inMemoryOrdersRepository.create(order2)

    const result = await sut.execute({
      adminId: 'deliveryman-1',
      userId: 'deliveryman-1',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value).toHaveLength(1)
      expect(result.value).toEqual([
        expect.objectContaining({
          id: new UniqueEntityID('order-1'),
          status: 'delivered',
          deliverymanId: new UniqueEntityID('deliveryman-1'),
        }),
      ])
    }
  })

  it('should return an error if requester does not exist', async () => {
    const deliveryman = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    await inMemoryUsersRepository.create(deliveryman)

    const result = await sut.execute({
      adminId: 'invalid-admin-id',
      userId: 'deliveryman-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UserNotFoundError)
    expect(result).toEqual(left(new UserNotFoundError()))
  })

  it('should return an error if userId does not exist', async () => {
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
      userId: 'invalid-user-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UserNotFoundError)
    expect(result).toEqual(left(new UserNotFoundError()))
  })

  it('should return an error if userId is not a deliveryman', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('admin-1'),
    )

    const nonDeliveryman = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('non-deliveryman-1'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryUsersRepository.create(nonDeliveryman)

    const result = await sut.execute({
      adminId: 'admin-1',
      userId: 'non-deliveryman-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UserNotDeliverymanError)
    expect(result).toEqual(left(new UserNotDeliverymanError()))
  })

  it('should return an error if deliveryman tries to list another deliveryman’s deliveries', async () => {
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
})
