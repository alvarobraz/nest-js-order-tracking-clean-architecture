import { describe, it, expect, beforeEach } from 'vitest'
import { ListRecipientsUseCase } from './list-recipients'
import { InMemoryRecipientsRepository } from 'test/repositories/in-memory-recipients-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeUser } from 'test/factories/make-users'
import { makeRecipient } from 'test/factories/make-recipient'
import { left } from '@/core/either'
import { OnlyActiveAdminsCanListRecipientsError } from './errors/only-active-admins-can-list-recipients-error'

let inMemoryRecipientsRepository: InMemoryRecipientsRepository
let inMemoryUsersRepository: InMemoryUsersRepository
let sut: ListRecipientsUseCase

describe('List Recipients Use Case', () => {
  beforeEach(() => {
    inMemoryRecipientsRepository = new InMemoryRecipientsRepository()
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new ListRecipientsUseCase(
      inMemoryRecipientsRepository,
      inMemoryUsersRepository,
    )
  })

  it('should list recipients if admin is valid and active', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('admin-1'),
    )

    const recipient1 = makeRecipient(
      {
        name: 'Ana Costa',
      },
      new UniqueEntityID('recipient-1'),
    )

    const recipient2 = makeRecipient(
      {
        name: 'Lucas Pereira',
      },
      new UniqueEntityID('recipient-2'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryRecipientsRepository.create(recipient1)
    await inMemoryRecipientsRepository.create(recipient2)

    const result = await sut.execute({ adminId: 'admin-1', page: 1 })

    expect(result.isRight()).toBe(true)
    expect(result.value).toBeInstanceOf(Array)
    expect(result.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: new UniqueEntityID('recipient-1'),
          name: 'Ana Costa',
        }),
        expect.objectContaining({
          id: new UniqueEntityID('recipient-2'),
          name: 'Lucas Pereira',
        }),
      ]),
    )
    expect(result.value).toHaveLength(2)
    expect(await inMemoryRecipientsRepository.findAll()).toHaveLength(2)
  })

  it('should return an empty array if no recipients exist', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('admin-1'),
    )

    await inMemoryUsersRepository.create(admin)

    const result = await sut.execute({ adminId: 'admin-1', page: 1 })

    expect(result.isRight()).toBe(true)
    expect(result.value).toBeInstanceOf(Array)
    expect(result.value).toEqual([])
    expect(result.value).toHaveLength(0)
    expect(await inMemoryRecipientsRepository.findAll()).toHaveLength(0)
  })

  it('should return an error if admin does not exist', async () => {
    const result = await sut.execute({ adminId: 'admin-1', page: 1 })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OnlyActiveAdminsCanListRecipientsError)
    expect(result).toEqual(left(new OnlyActiveAdminsCanListRecipientsError()))
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

    const result = await sut.execute({ adminId: 'deliveryman-1', page: 1 })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OnlyActiveAdminsCanListRecipientsError)
    expect(result).toEqual(left(new OnlyActiveAdminsCanListRecipientsError()))
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

    const result = await sut.execute({ adminId: 'admin-1', page: 1 })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(OnlyActiveAdminsCanListRecipientsError)
    expect(result).toEqual(left(new OnlyActiveAdminsCanListRecipientsError()))
  })
})
