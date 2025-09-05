import { describe, it, expect, beforeEach } from 'vitest'
import { ListDeliverymenUseCase } from './list-deliverymen'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeUser } from 'test/factories/make-users'
import { left } from '@/core/either'
import { OnlyActiveAdminsCanListDeliverymenError } from './errors/only-active-admins-can-list-deliverymen-error'

let inMemoryUsersRepository: InMemoryUsersRepository
let sut: ListDeliverymenUseCase

describe('List Deliverymen Use Case', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new ListDeliverymenUseCase(inMemoryUsersRepository)
  })

  it('should list active deliverymen if admin is valid and active', async () => {
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

    const result = await sut.execute({ adminId: 'admin-1' })

    expect(result.isRight()).toBe(true)
    expect(result.value).toBeInstanceOf(Array)
    expect(result.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'João Silva',
          id: new UniqueEntityID('deliveryman-1'),
          role: 'deliveryman',
          status: 'active',
        }),
        expect.objectContaining({
          name: 'Maria Oliveira',
          id: new UniqueEntityID('deliveryman-2'),
          role: 'deliveryman',
          status: 'active',
        }),
        expect.objectContaining({
          name: 'Pedro Santos',
          id: new UniqueEntityID('deliveryman-3'),
          role: 'deliveryman',
          status: 'active',
        }),
      ]),
    )
    expect(result.value).toHaveLength(3)
    expect(await inMemoryUsersRepository.findAllDeliverymen()).toHaveLength(3)
  })

  it('should return an error if admin does not exist', async () => {
    const result = await sut.execute({ adminId: 'admin-1' })

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

    const result = await sut.execute({ adminId: 'deliveryman-1' })

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

    const result = await sut.execute({ adminId: 'admin-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OnlyActiveAdminsCanListDeliverymenError)
    expect(result).toEqual(left(new OnlyActiveAdminsCanListDeliverymenError()))
  })
})
