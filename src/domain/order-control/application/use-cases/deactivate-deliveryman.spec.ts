import { describe, it, expect, beforeEach } from 'vitest'
import { DeactivateDeliverymanUseCase } from './deactivate-deliveryman'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { User } from '@/domain/order-control/enterprise/entities/user'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeUser } from 'test/factories/make-users'
import { left } from '@/core/either'
import { OnlyActiveAdminsCanDeactivateDeliverymenError } from './errors/only-active-admins-can-deactivate-deliverymen-error'
import { ActiveDeliverymanNotFoundError } from './errors/active-deliveryman-not-found-error'

let inMemoryUsersRepository: InMemoryUsersRepository
let sut: DeactivateDeliverymanUseCase

describe('Deactivate Deliveryman Use Case', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new DeactivateDeliverymanUseCase(inMemoryUsersRepository)
  })

  it('should deactivate a deliveryman if admin is valid and active', async () => {
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

    await inMemoryUsersRepository.create(admin)
    await inMemoryUsersRepository.create(deliveryman)

    const result = await sut.execute({
      adminId: 'admin-1',
      deliverymanId: 'deliveryman-1',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toMatchObject({
      deliveryman: expect.any(User),
    })
    const deactivatedDeliveryman = (result.value as { deliveryman: User })
      .deliveryman
    expect(deactivatedDeliveryman).toBeInstanceOf(User)
    expect(deactivatedDeliveryman.status).toBe('inactive')
    expect(inMemoryUsersRepository.items).toHaveLength(2)
    expect(inMemoryUsersRepository.items[1].id).toEqual(
      deactivatedDeliveryman.id,
    )
    expect(inMemoryUsersRepository.items[1].status).toBe('inactive')
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
      deliverymanId: 'deliveryman-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveAdminsCanDeactivateDeliverymenError,
    )
    expect(result).toEqual(
      left(new OnlyActiveAdminsCanDeactivateDeliverymenError()),
    )
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
      deliverymanId: 'deliveryman-2',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveAdminsCanDeactivateDeliverymenError,
    )
    expect(result).toEqual(
      left(new OnlyActiveAdminsCanDeactivateDeliverymenError()),
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
      deliverymanId: 'deliveryman-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveAdminsCanDeactivateDeliverymenError,
    )
    expect(result).toEqual(
      left(new OnlyActiveAdminsCanDeactivateDeliverymenError()),
    )
  })

  it('should return an error if deliveryman does not exist', async () => {
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
      deliverymanId: 'deliveryman-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ActiveDeliverymanNotFoundError)
    expect(result).toEqual(left(new ActiveDeliverymanNotFoundError()))
  })

  it('should return an error if deliveryman is not a deliveryman', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('admin-1'),
    )

    const notDeliveryman = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('admin-2'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryUsersRepository.create(notDeliveryman)

    const result = await sut.execute({
      adminId: 'admin-1',
      deliverymanId: 'admin-2',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ActiveDeliverymanNotFoundError)
    expect(result).toEqual(left(new ActiveDeliverymanNotFoundError()))
  })

  it('should return an error if deliveryman is already inactive', async () => {
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
        status: 'inactive',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryUsersRepository.create(deliveryman)

    const result = await sut.execute({
      adminId: 'admin-1',
      deliverymanId: 'deliveryman-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ActiveDeliverymanNotFoundError)
    expect(result).toEqual(left(new ActiveDeliverymanNotFoundError()))
  })
})
