import { describe, it, expect, beforeEach } from 'vitest'
import { CreateOrderUseCase } from './create-order'
import { InMemoryOrdersRepository } from 'test/repositories/in-memory-orders-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { InMemoryRecipientsRepository } from 'test/repositories/in-memory-recipients-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeOrder } from 'test/factories/make-order'
import { makeUser } from 'test/factories/make-users'
import { makeRecipient } from 'test/factories/make-recipient'
import { Order } from '@/domain/order-control/enterprise/entities/order'
import { left } from '@/core/either'
import { OnlyActiveAdminsCanCreateOrdersError } from './errors/only-active-admins-can-create-orders-error'

let inMemoryOrdersRepository: InMemoryOrdersRepository
let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryRecipientsRepository: InMemoryRecipientsRepository
let sut: CreateOrderUseCase

describe('Create Order Use Case', () => {
  beforeEach(() => {
    inMemoryOrdersRepository = new InMemoryOrdersRepository()
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryRecipientsRepository = new InMemoryRecipientsRepository()
    sut = new CreateOrderUseCase(
      inMemoryOrdersRepository,
      inMemoryUsersRepository,
    )
  })

  it('should create an order if admin is valid and active', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('admin-1'),
    )

    const recipient = makeRecipient(
      {
        name: 'João Silva',
      },
      new UniqueEntityID('recipient-1'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryRecipientsRepository.create(recipient)

    const orderProps = makeOrder({
      recipientId: new UniqueEntityID('recipient-1'),
    })

    const result = await sut.execute({
      adminId: 'admin-1',
      recipientId: 'recipient-1',
      street: orderProps.street,
      number: orderProps.number,
      neighborhood: orderProps.neighborhood,
      city: orderProps.city,
      state: orderProps.state,
      zipCode: orderProps.zipCode,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toMatchObject({
      order: expect.any(Order),
    })
    const order = (result.value as { order: Order }).order
    expect(order.status).toBe('pending')
    expect(order.street).toBe(orderProps.street)
    expect(order.number).toBe(orderProps.number)
    expect(order.neighborhood).toBe(orderProps.neighborhood)
    expect(order.city).toBe(orderProps.city)
    expect(order.state).toBe(orderProps.state)
    expect(order.zipCode).toBe(orderProps.zipCode)
    expect(order.recipientId).toBeDefined()
    expect(order.recipientId?.toString()).toBe('recipient-1')
    expect(inMemoryOrdersRepository.items).toHaveLength(1)
    expect(inMemoryOrdersRepository.items[0].id).toEqual(order.id)
    expect(inMemoryOrdersRepository.items[0].recipientId?.toString()).toBe(
      'recipient-1',
    )
  })

  it('should return an error if admin does not exist', async () => {
    const recipient = makeRecipient(
      {
        name: 'João Silva',
      },
      new UniqueEntityID('recipient-1'),
    )

    await inMemoryRecipientsRepository.create(recipient)

    const orderProps = makeOrder({
      recipientId: new UniqueEntityID('recipient-1'),
    })

    const result = await sut.execute({
      adminId: 'admin-1',
      recipientId: 'recipient-1',
      street: orderProps.street,
      number: orderProps.number,
      neighborhood: orderProps.neighborhood,
      city: orderProps.city,
      state: orderProps.state,
      zipCode: orderProps.zipCode,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OnlyActiveAdminsCanCreateOrdersError)
    expect(result).toEqual(left(new OnlyActiveAdminsCanCreateOrdersError()))
  })

  it('should return an error if admin is not an admin', async () => {
    const deliveryman = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    const recipient = makeRecipient(
      {
        name: 'João Silva',
      },
      new UniqueEntityID('recipient-1'),
    )

    await inMemoryUsersRepository.create(deliveryman)
    await inMemoryRecipientsRepository.create(recipient)

    const orderProps = makeOrder({
      recipientId: new UniqueEntityID('recipient-1'),
    })

    const result = await sut.execute({
      adminId: 'deliveryman-1',
      recipientId: 'recipient-1',
      street: orderProps.street,
      number: orderProps.number,
      neighborhood: orderProps.neighborhood,
      city: orderProps.city,
      state: orderProps.state,
      zipCode: orderProps.zipCode,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OnlyActiveAdminsCanCreateOrdersError)
    expect(result).toEqual(left(new OnlyActiveAdminsCanCreateOrdersError()))
  })

  it('should return an error if admin is inactive', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'inactive',
      },
      new UniqueEntityID('admin-1'),
    )

    const recipient = makeRecipient(
      {
        name: 'João Silva',
      },
      new UniqueEntityID('recipient-1'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryRecipientsRepository.create(recipient)

    const orderProps = makeOrder({
      recipientId: new UniqueEntityID('recipient-1'),
    })

    const result = await sut.execute({
      adminId: 'admin-1',
      recipientId: 'recipient-1',
      street: orderProps.street,
      number: orderProps.number,
      neighborhood: orderProps.neighborhood,
      city: orderProps.city,
      state: orderProps.state,
      zipCode: orderProps.zipCode,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OnlyActiveAdminsCanCreateOrdersError)
    expect(result).toEqual(left(new OnlyActiveAdminsCanCreateOrdersError()))
  })
})
