import { describe, it, expect, beforeEach } from 'vitest'
import { ListMyOrderUseCase } from './list-my-order'
import { InMemoryOrdersRepository } from 'test/repositories/in-memory-orders-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { InMemoryOrderAttachmentsRepository } from 'test/repositories/in-memory-order-attachments-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeUser } from 'test/factories/make-users'
import { makeOrder } from 'test/factories/make-order'
import { left } from '@/core/either'
import { UserNotFoundError } from './errors/user-not-found-error'
import { UserNotDeliverymanError } from './errors/user-not-deliveryman-error'
import { OnlyActiveDeliverymenCanListOrdersError } from './errors/only-active-deliverymen-can-list-orders-error'

let inMemoryOrdersRepository: InMemoryOrdersRepository
let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryOrderAttachmentsRepository: InMemoryOrderAttachmentsRepository
let sut: ListMyOrderUseCase

describe('List My Order Use Case', () => {
  beforeEach(() => {
    inMemoryOrderAttachmentsRepository =
      new InMemoryOrderAttachmentsRepository()
    inMemoryOrdersRepository = new InMemoryOrdersRepository(
      inMemoryOrderAttachmentsRepository,
    )
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new ListMyOrderUseCase(
      inMemoryOrdersRepository,
      inMemoryUsersRepository,
    )
  })

  it("should list the delivery person's own orders when he is active", async () => {
    const deliveryman = makeUser(
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

    const order1 = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
        deliverymanId: new UniqueEntityID('deliveryman-1'),
        status: 'picked_up',
      },
      new UniqueEntityID('order-1'),
    )

    const order2 = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
        deliverymanId: new UniqueEntityID('deliveryman-1'),
        status: 'delivered',
      },
      new UniqueEntityID('order-2'),
    )

    const order3 = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
        deliverymanId: new UniqueEntityID('deliveryman-2'),
        status: 'picked_up',
      },
      new UniqueEntityID('order-2'),
    )

    await inMemoryUsersRepository.create(deliveryman)
    await inMemoryUsersRepository.create(deliveryman2)
    await inMemoryOrdersRepository.create(order1)
    await inMemoryOrdersRepository.create(order2)
    await inMemoryOrdersRepository.create(order3)

    const result = await sut.execute({
      userId: 'deliveryman-1',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value).toHaveLength(2)
      expect(result.value).toEqual([
        expect.objectContaining({
          id: new UniqueEntityID('order-1'),
          status: 'picked_up',
          deliverymanId: new UniqueEntityID('deliveryman-1'),
        }),
        expect.objectContaining({
          id: new UniqueEntityID('order-2'),
          status: 'delivered',
          deliverymanId: new UniqueEntityID('deliveryman-1'),
        }),
      ])
    }
  })

  it('should return an error if user does not exist', async () => {
    const result = await sut.execute({
      userId: 'invalid-user-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UserNotFoundError)
    expect(result).toEqual(left(new UserNotFoundError()))
  })

  it('should return an error if user is not a deliveryman', async () => {
    const user = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('admin-1'),
    )

    await inMemoryUsersRepository.create(user)

    const result = await sut.execute({
      userId: 'admin-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UserNotDeliverymanError)
    expect(result).toEqual(left(new UserNotDeliverymanError()))
  })

  it('should return an error if deliveryman is not active', async () => {
    const deliveryman = makeUser(
      {
        role: 'deliveryman',
        status: 'inactive',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    await inMemoryUsersRepository.create(deliveryman)

    const result = await sut.execute({
      userId: 'deliveryman-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OnlyActiveDeliverymenCanListOrdersError)
    expect(result).toEqual(left(new OnlyActiveDeliverymenCanListOrdersError()))
  })
})
