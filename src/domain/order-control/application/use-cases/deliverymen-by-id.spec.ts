import { describe, it, expect, beforeEach } from 'vitest'

import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeUser } from 'test/factories/make-users'
import { left } from '@/core/either'
import { OnlyActiveAdminsCanListDeliverymenError } from './errors/only-active-admins-can-list-deliverymen-error'
import { ListDeliverymenByIdUseCase } from './deliverymen-by-id'

let inMemoryUsersRepository: InMemoryUsersRepository
let sut: ListDeliverymenByIdUseCase

describe('List Deliverymen By Id Use Case', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new ListDeliverymenByIdUseCase(inMemoryUsersRepository)
  })

  it('should list an active deliverymen if admin is valid and active', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('admin-1'),
    )

    const deliveryman1 = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
        name: 'João Silva',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    const deliveryman2 = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
        name: 'Maria Oliveira',
      },
      new UniqueEntityID('deliveryman-2'),
    )

    const deliveryman3 = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
        name: 'Pedro Santos',
      },
      new UniqueEntityID('deliveryman-3'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryUsersRepository.create(deliveryman1)
    await inMemoryUsersRepository.create(deliveryman2)
    await inMemoryUsersRepository.create(deliveryman3)

    const result = await sut.execute({
      adminId: 'admin-1',
      userId: 'deliveryman-1',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toBeInstanceOf(Object)
    expect(result.value).toEqual(
      expect.objectContaining({
        name: 'João Silva',
        id: new UniqueEntityID('deliveryman-1'),
        role: 'deliveryman',
        status: 'active',
      }),
    )
  })

  it('should return an error if admin does not exist', async () => {
    const result = await sut.execute({
      adminId: 'admin-1',
      userId: 'deliveryman-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OnlyActiveAdminsCanListDeliverymenError)
    expect(result).toEqual(left(new OnlyActiveAdminsCanListDeliverymenError()))
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

    const result = await sut.execute({
      adminId: 'deliveryman-1',
      userId: 'admin-1',
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

    await inMemoryUsersRepository.create(admin)

    const result = await sut.execute({
      adminId: 'admin-1',
      userId: 'deliveryman-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OnlyActiveAdminsCanListDeliverymenError)
    expect(result).toEqual(left(new OnlyActiveAdminsCanListDeliverymenError()))
  })
})
