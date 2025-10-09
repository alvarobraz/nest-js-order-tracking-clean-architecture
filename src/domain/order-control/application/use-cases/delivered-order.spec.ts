import { describe, it, expect, beforeEach } from 'vitest'
import { DeliveredOrderUseCase } from './delivered-order'
import { InMemoryOrdersRepository } from 'test/repositories/in-memory-orders-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { InMemoryOrderAttachmentsRepository } from 'test/repositories/in-memory-order-attachments-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeUser } from 'test/factories/make-users'
import { makeOrder } from 'test/factories/make-order'
import { left } from '@/core/either'
import { OnlyActiveDeliverymenCanMarkOrdersAsDeliveredError } from './errors/only-active-deliverymen-can-mark-orders-as-delivered-error'
import { OrderNotFoundError } from './errors/order-not-found-error'
import { OnlyAssignedDeliverymanCanMarkOrderAsDeliveredError } from './errors/only-assigned-deliveryman-can-mark-order-as-delivered-error'
import { OrderMustBePickedUpToBeMarkedAsDeliveredError } from './errors/order-must-be-picked-up-to-be-marked-as-delivered-error'
import { DeliveryPhotoIsRequiredError } from './errors/delivery-photo-is-required-error'
import { OrderAttachmentList } from '../../enterprise/entities/order-attachment-list'

let inMemoryOrdersRepository: InMemoryOrdersRepository
let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryOrderAttachmentsRepository: InMemoryOrderAttachmentsRepository
let sut: DeliveredOrderUseCase

describe('Mark Order As Delivered', () => {
  beforeEach(() => {
    inMemoryOrderAttachmentsRepository =
      new InMemoryOrderAttachmentsRepository()
    inMemoryOrdersRepository = new InMemoryOrdersRepository(
      (inMemoryOrderAttachmentsRepository =
        new InMemoryOrderAttachmentsRepository()),
    )
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryOrderAttachmentsRepository =
      new InMemoryOrderAttachmentsRepository()
    sut = new DeliveredOrderUseCase(
      inMemoryOrdersRepository,
      inMemoryOrderAttachmentsRepository,
      inMemoryUsersRepository,
    )
  })

  it('should mark order as delivered with attachments if deliveryman is valid and active', async () => {
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
        deliverymanId: new UniqueEntityID('deliveryman-1'),
        status: 'picked_up',
        deliveryPhoto: new OrderAttachmentList(),
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryUsersRepository.create(deliveryman)
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      deliverymanId: 'deliveryman-1',
      orderId: 'order-1',
      deliveryPhotoIds: ['photo-1', 'photo-2'],
    })

    expect(result.isRight()).toBe(true)
    const savedOrder = await inMemoryOrdersRepository.findById('order-1')

    expect(savedOrder).toBeDefined()
    expect(savedOrder?.status).toBe('delivered')
    expect(
      savedOrder?.deliverymanId.equals(new UniqueEntityID('deliveryman-1')),
    ).toBeTruthy()

    expect(savedOrder?.deliveryPhoto).toBeInstanceOf(OrderAttachmentList)
    expect(savedOrder?.deliveryPhoto.currentItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          orderId: expect.objectContaining({ value: 'order-1' }),
          attachmentId: expect.objectContaining({ value: 'photo-1' }),
        }),
        expect.objectContaining({
          orderId: expect.objectContaining({ value: 'order-1' }),
          attachmentId: expect.objectContaining({ value: 'photo-2' }),
        }),
      ]),
    )
  })

  it('should return error if deliveryman does not exist', async () => {
    const order = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
        deliverymanId: new UniqueEntityID('deliveryman-1'),
        status: 'picked_up',
        deliveryPhoto: new OrderAttachmentList(),
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      deliverymanId: 'deliveryman-1',
      orderId: 'order-1',
      deliveryPhotoIds: ['photo-1'],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveDeliverymenCanMarkOrdersAsDeliveredError,
    )
    expect(result).toEqual(
      left(new OnlyActiveDeliverymenCanMarkOrdersAsDeliveredError()),
    )
    expect(await inMemoryOrdersRepository.findById('order-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('order-1'),
        status: 'picked_up',
        deliveryPhoto: expect.any(OrderAttachmentList),
      }),
    )
    expect(
      (await inMemoryOrdersRepository.findById('order-1'))!.deliveryPhoto
        .currentItems,
    ).toHaveLength(0)
    expect(
      await inMemoryOrderAttachmentsRepository.findManyByOrderId('order-1'),
    ).toEqual([])
  })

  it('should return error if deliveryman does not exist', async () => {
    const order = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
        deliverymanId: new UniqueEntityID('deliveryman-1'),
        status: 'picked_up',
        deliveryPhoto: new OrderAttachmentList(),
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      deliverymanId: 'deliveryman-1',
      orderId: 'order-1',
      deliveryPhotoIds: ['photo-1'],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveDeliverymenCanMarkOrdersAsDeliveredError,
    )
    expect(result).toEqual(
      left(new OnlyActiveDeliverymenCanMarkOrdersAsDeliveredError()),
    )
    expect(await inMemoryOrdersRepository.findById('order-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('order-1'),
        status: 'picked_up',
        deliveryPhoto: expect.any(OrderAttachmentList),
      }),
    )
    expect(
      await inMemoryOrderAttachmentsRepository.findManyByOrderId('order-1'),
    ).toEqual([])
  })

  it('should return error if user is not a deliveryman', async () => {
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
        deliverymanId: new UniqueEntityID('deliveryman-1'),
        status: 'picked_up',
        deliveryPhoto: new OrderAttachmentList(),
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      deliverymanId: 'admin-1',
      orderId: 'order-1',
      deliveryPhotoIds: ['photo-1'],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveDeliverymenCanMarkOrdersAsDeliveredError,
    )
    expect(result).toEqual(
      left(new OnlyActiveDeliverymenCanMarkOrdersAsDeliveredError()),
    )
    expect(await inMemoryOrdersRepository.findById('order-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('order-1'),
        status: 'picked_up',
        deliveryPhoto: expect.any(OrderAttachmentList),
      }),
    )
    expect(
      await inMemoryOrderAttachmentsRepository.findManyByOrderId('order-1'),
    ).toEqual([])
  })

  it('should return error if deliveryman is inactive', async () => {
    const deliveryman = makeUser(
      {
        role: 'deliveryman',
        status: 'inactive',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    const order = makeOrder(
      {
        recipientId: new UniqueEntityID('recipient-1'),
        deliverymanId: new UniqueEntityID('deliveryman-1'),
        status: 'picked_up',
        deliveryPhoto: new OrderAttachmentList(),
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryUsersRepository.create(deliveryman)
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      deliverymanId: 'deliveryman-1',
      orderId: 'order-1',
      deliveryPhotoIds: ['photo-1'],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveDeliverymenCanMarkOrdersAsDeliveredError,
    )
    expect(result).toEqual(
      left(new OnlyActiveDeliverymenCanMarkOrdersAsDeliveredError()),
    )
    expect(await inMemoryOrdersRepository.findById('order-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('order-1'),
        status: 'picked_up',
        deliveryPhoto: expect.any(OrderAttachmentList),
      }),
    )
    expect(
      await inMemoryOrderAttachmentsRepository.findManyByOrderId('order-1'),
    ).toEqual([])
  })

  it('should return error if order does not exist', async () => {
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
      deliveryPhotoIds: ['photo-1'],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OrderNotFoundError)
    expect(result).toEqual(left(new OrderNotFoundError()))
    expect(await inMemoryOrdersRepository.findById('order-1')).toBeNull()
    expect(
      await inMemoryOrderAttachmentsRepository.findManyByOrderId('order-1'),
    ).toEqual([])
  })

  it('should return error if deliveryman is not assigned to the order', async () => {
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
        deliverymanId: new UniqueEntityID('deliveryman-2'),
        status: 'picked_up',
        deliveryPhoto: new OrderAttachmentList(),
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryUsersRepository.create(deliveryman)
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      deliverymanId: 'deliveryman-1',
      orderId: 'order-1',
      deliveryPhotoIds: ['photo-1'],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyAssignedDeliverymanCanMarkOrderAsDeliveredError,
    )
    expect(result).toEqual(
      left(new OnlyAssignedDeliverymanCanMarkOrderAsDeliveredError()),
    )
    expect(await inMemoryOrdersRepository.findById('order-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('order-1'),
        status: 'picked_up',
        deliveryPhoto: expect.any(OrderAttachmentList),
      }),
    )
    expect(
      await inMemoryOrderAttachmentsRepository.findManyByOrderId('order-1'),
    ).toEqual([])
  })

  it('should return error if order is not picked up', async () => {
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
        deliverymanId: new UniqueEntityID('deliveryman-1'),
        status: 'pending',
        deliveryPhoto: new OrderAttachmentList(),
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryUsersRepository.create(deliveryman)
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      deliverymanId: 'deliveryman-1',
      orderId: 'order-1',
      deliveryPhotoIds: ['photo-1'],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OrderMustBePickedUpToBeMarkedAsDeliveredError,
    )
    expect(result).toEqual(
      left(new OrderMustBePickedUpToBeMarkedAsDeliveredError()),
    )
    expect(await inMemoryOrdersRepository.findById('order-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('order-1'),
        status: 'pending',
        deliveryPhoto: expect.any(OrderAttachmentList),
      }),
    )
    expect(
      await inMemoryOrderAttachmentsRepository.findManyByOrderId('order-1'),
    ).toEqual([])
  })

  it('should return error if delivery photo IDs are not provided', async () => {
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
        deliverymanId: new UniqueEntityID('deliveryman-1'),
        status: 'picked_up',
        deliveryPhoto: new OrderAttachmentList(),
      },
      new UniqueEntityID('order-1'),
    )

    await inMemoryUsersRepository.create(deliveryman)
    await inMemoryOrdersRepository.create(order)

    const result = await sut.execute({
      deliverymanId: 'deliveryman-1',
      orderId: 'order-1',
      deliveryPhotoIds: [],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(DeliveryPhotoIsRequiredError)
    expect(result).toEqual(left(new DeliveryPhotoIsRequiredError()))
    expect(await inMemoryOrdersRepository.findById('order-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('order-1'),
        status: 'picked_up',
        deliveryPhoto: expect.any(OrderAttachmentList),
      }),
    )
    expect(
      await inMemoryOrderAttachmentsRepository.findManyByOrderId('order-1'),
    ).toEqual([])
  })
})
