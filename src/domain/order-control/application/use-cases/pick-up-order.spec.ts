import { describe, it, expect, beforeEach } from 'vitest'
import { PickUpOrderUseCase } from './pick-up-order'
import { InMemoryOrdersRepository } from 'test/repositories/in-memory-orders-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { InMemoryRecipientsRepository } from 'test/repositories/in-memory-recipients-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeUser } from 'test/factories/make-users'
import { makeOrder } from 'test/factories/make-order'
import { makeRecipient } from 'test/factories/make-recipient'
import { Order } from '@/domain/order-control/enterprise/entities/order'
import { left } from '@/core/either'
import { OnlyActiveDeliverymenCanPickUpOrdersError } from './errors/only-active-deliverymen-can-pick-up-orders-error'
import { OrderNotFoundError } from './errors/order-not-found-error'
import { OrderMustBePendingToBePickedUpError } from './errors/order-must-be-pending-to-be-picked-up-error'
import { InMemoryOrderAttachmentsRepository } from 'test/repositories/in-memory-order-attachments-repository'

let inMemoryOrderAttachmentsRepository: InMemoryOrderAttachmentsRepository
let inMemoryOrdersRepository: InMemoryOrdersRepository
let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryRecipientsRepository: InMemoryRecipientsRepository
let sut: PickUpOrderUseCase

describe('Pick Up Order Use Case', () => {
  beforeEach(() => {
    inMemoryOrderAttachmentsRepository =
      new InMemoryOrderAttachmentsRepository()
    inMemoryOrdersRepository = new InMemoryOrdersRepository(
      inMemoryOrderAttachmentsRepository,
    )
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryRecipientsRepository = new InMemoryRecipientsRepository()
    sut = new PickUpOrderUseCase(
      inMemoryOrdersRepository,
      inMemoryUsersRepository,
    )
  })

  it('should pick up an order if deliveryman is valid and active and order is pending', async () => {
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

    const order = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryOrdersRepository.create(order)

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
      orderId: 'order-1',
    })

    expect(result.isRight()).toBe(true)

    expect(result.value).toMatchObject({
      order: expect.any(Order),
    })
  })

  it('should return an error if deliveryman does not exist', async () => {
    const recipient = makeRecipient(
      {
        name: 'João Silva',
      },
      new UniqueEntityID('recipient-1'),
    )

    const order = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
        status: 'pending',
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryRecipientsRepository.create(recipient)
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      deliverymanId: 'deliveryman-1',
      orderId: 'order-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveDeliverymenCanPickUpOrdersError,
    )
    expect(result).toEqual(
      left(new OnlyActiveDeliverymenCanPickUpOrdersError()),
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

    const recipient = makeRecipient(
      {
        name: 'João Silva',
      },
      new UniqueEntityID('recipient-1'),
    )

    const order = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
        status: 'pending',
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryRecipientsRepository.create(recipient)
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      deliverymanId: 'admin-1',
      orderId: 'order-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveDeliverymenCanPickUpOrdersError,
    )
    expect(result).toEqual(
      left(new OnlyActiveDeliverymenCanPickUpOrdersError()),
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

    const recipient = makeRecipient(
      {
        name: 'João Silva',
      },
      new UniqueEntityID('recipient-1'),
    )

    const order = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
        status: 'pending',
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryUsersRepository.create(deliveryman)
    await inMemoryRecipientsRepository.create(recipient)
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      deliverymanId: 'deliveryman-1',
      orderId: 'order-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveDeliverymenCanPickUpOrdersError,
    )
    expect(result).toEqual(
      left(new OnlyActiveDeliverymenCanPickUpOrdersError()),
    )
  })

  it('should return an error if order does not exist', async () => {
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
      orderId: 'order-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderNotFoundError)
    expect(result).toEqual(left(new OrderNotFoundError()))
  })

  it('should return an error if order is not pending', async () => {
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
        neighborhood: 'Barra da Tijuca',
      },
      new UniqueEntityID('recipient-1'),
    )

    const order = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
        status: 'picked_up',
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryUsersRepository.create(deliveryman)
    await inMemoryRecipientsRepository.create(recipient)
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      deliverymanId: 'deliveryman-1',
      orderId: 'order-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderMustBePendingToBePickedUpError)
    expect(result).toEqual(left(new OrderMustBePendingToBePickedUpError()))
  })
})
