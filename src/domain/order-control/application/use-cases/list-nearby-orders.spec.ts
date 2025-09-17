import { describe, it, expect, beforeEach } from 'vitest'
import { ListNearbyOrdersUseCase } from './list-nearby-orders'
import { InMemoryOrdersRepository } from 'test/repositories/in-memory-orders-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeUser } from 'test/factories/make-users'
import { makeOrder } from 'test/factories/make-order'
import { makeRecipient } from 'test/factories/make-recipient'
import { left } from '@/core/either'
import { OnlyActiveDeliverymenCanListNearbyOrdersError } from './errors/only-active-deliverymen-can-list-nearby-orders-error'
import { Order } from '@/domain/order-control/enterprise/entities/order'
import { Recipient } from '@/domain/order-control/enterprise/entities/recipient'

let inMemoryOrdersRepository: InMemoryOrdersRepository
let inMemoryUsersRepository: InMemoryUsersRepository
let sut: ListNearbyOrdersUseCase

describe('List Nearby Orders Use Case', () => {
  beforeEach(() => {
    inMemoryOrdersRepository = new InMemoryOrdersRepository()
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new ListNearbyOrdersUseCase(
      inMemoryOrdersRepository,
      inMemoryUsersRepository,
    )
  })

  it('should list nearby orders if deliveryman is valid and active', async () => {
    const deliveryman = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    const recipient1 = makeRecipient(
      {
        neighborhood: 'Barra da Tijuca',
      },
      new UniqueEntityID('recipient-1'),
    )

    const recipient2 = makeRecipient(
      {
        neighborhood: 'Copacabana',
      },
      new UniqueEntityID('recipient-2'),
    )

    const order1 = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
      },
      new UniqueEntityID('order-1'),
    )

    const order2 = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
      },
      new UniqueEntityID('order-2'),
    )

    const order3 = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-2'),
      },
      new UniqueEntityID('order-3'),
    )

    await inMemoryUsersRepository.create(deliveryman)
    await inMemoryOrdersRepository.create({
      ...order1,
      recipient: recipient1,
    } as Order & { recipient?: Recipient })
    await inMemoryOrdersRepository.create({
      ...order2,
      recipient: recipient1,
    } as Order & { recipient?: Recipient })
    await inMemoryOrdersRepository.create({
      ...order3,
      recipient: recipient2,
    } as Order & { recipient?: Recipient })

    const result = await sut.execute({
      deliverymanId: 'deliveryman-1',
      neighborhood: 'Barra',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toBeInstanceOf(Array)
    expect(result.value).toHaveLength(2)
    expect(result.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.objectContaining({ value: 'order-1' }),
          recipientId: expect.objectContaining({ value: 'recipient-1' }),
          recipient: expect.objectContaining({
            id: expect.objectContaining({ value: 'recipient-1' }),
            neighborhood: 'Barra da Tijuca',
          }),
        }),
        expect.objectContaining({
          id: expect.objectContaining({ value: 'order-2' }),
          recipientId: expect.objectContaining({ value: 'recipient-1' }),
          recipient: expect.objectContaining({
            id: expect.objectContaining({ value: 'recipient-1' }),
            neighborhood: 'Barra da Tijuca',
          }),
        }),
      ]),
    )
    expect(await inMemoryOrdersRepository.findNearby('Barra')).toHaveLength(2)
  })

  it('should return an empty array if no orders match the neighborhood', async () => {
    const deliveryman = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    await inMemoryUsersRepository.create(deliveryman)

    const result = await sut.execute({
      deliverymanId: 'deliveryman-1',
      neighborhood: 'NonExistent',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toBeInstanceOf(Array)
    expect(result.value).toEqual([])
    expect(result.value).toHaveLength(0)
    expect(
      await inMemoryOrdersRepository.findNearby('NonExistent'),
    ).toHaveLength(0)
  })

  it('should return an error if deliveryman does not exist', async () => {
    const result = await sut.execute({
      deliverymanId: 'deliveryman-1',
      neighborhood: 'Barra',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveDeliverymenCanListNearbyOrdersError,
    )
    expect(result).toEqual(
      left(new OnlyActiveDeliverymenCanListNearbyOrdersError()),
    )
  })

  it('should return an error if user is not a deliveryman', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('admin-1'),
    )

    await inMemoryUsersRepository.create(admin)

    const result = await sut.execute({
      deliverymanId: 'admin-1',
      neighborhood: 'Barra',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveDeliverymenCanListNearbyOrdersError,
    )
    expect(result).toEqual(
      left(new OnlyActiveDeliverymenCanListNearbyOrdersError()),
    )
  })

  it('should return an error if deliveryman is inactive', async () => {
    const deliveryman = makeUser(
      {
        role: 'deliveryman',
        status: 'inactive',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    await inMemoryUsersRepository.create(deliveryman)

    const result = await sut.execute({
      deliverymanId: 'deliveryman-1',
      neighborhood: 'Barra',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveDeliverymenCanListNearbyOrdersError,
    )
    expect(result).toEqual(
      left(new OnlyActiveDeliverymenCanListNearbyOrdersError()),
    )
  })
})
