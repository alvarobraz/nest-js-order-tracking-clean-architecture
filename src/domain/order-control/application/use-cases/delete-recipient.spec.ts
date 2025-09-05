import { describe, it, expect, beforeEach } from 'vitest'
import { DeleteRecipientUseCase } from './delete-recipient'
import { InMemoryRecipientsRepository } from 'test/repositories/in-memory-recipients-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeUser } from 'test/factories/make-users'
import { makeRecipient } from 'test/factories/make-recipient'
import { left } from '@/core/either'
import { OnlyActiveAdminsCanDeleteRecipientsError } from './errors/only-active-admins-can-delete-recipients-error'
import { RecipientNotFoundError } from './errors/recipient-not-found-error'

let inMemoryRecipientsRepository: InMemoryRecipientsRepository
let inMemoryUsersRepository: InMemoryUsersRepository
let sut: DeleteRecipientUseCase

describe('Delete Recipient Use Case', () => {
  beforeEach(() => {
    inMemoryRecipientsRepository = new InMemoryRecipientsRepository()
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new DeleteRecipientUseCase(
      inMemoryRecipientsRepository,
      inMemoryUsersRepository,
    )
  })

  it('should delete a recipient if admin is valid and active', async () => {
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
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'Curitiba',
        state: 'PR',
        zipCode: '80010-000',
        phone: '(41) 91234-5678',
        email: 'joao@example.com',
      },
      new UniqueEntityID('recipient-1'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryRecipientsRepository.create(recipient)

    const result = await sut.execute({
      adminId: 'admin-1',
      recipientId: 'recipient-1',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual(null)
    expect(
      await inMemoryRecipientsRepository.findById('recipient-1'),
    ).toBeNull()
    expect(inMemoryRecipientsRepository.items).toHaveLength(0)
  })

  it('should return an error if admin does not exist', async () => {
    const recipient = makeRecipient(
      {
        name: 'João Silva',
      },
      new UniqueEntityID('recipient-1'),
    )

    await inMemoryRecipientsRepository.create(recipient)

    const result = await sut.execute({
      adminId: 'admin-1',
      recipientId: 'recipient-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveAdminsCanDeleteRecipientsError,
    )
    expect(result).toEqual(left(new OnlyActiveAdminsCanDeleteRecipientsError()))
    expect(await inMemoryRecipientsRepository.findById('recipient-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('recipient-1'),
        name: 'João Silva',
      }),
    )
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

    const result = await sut.execute({
      adminId: 'deliveryman-1',
      recipientId: 'recipient-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveAdminsCanDeleteRecipientsError,
    )
    expect(result).toEqual(left(new OnlyActiveAdminsCanDeleteRecipientsError()))
    expect(await inMemoryRecipientsRepository.findById('recipient-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('recipient-1'),
        name: 'João Silva',
      }),
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

    const recipient = makeRecipient(
      {
        name: 'João Silva',
      },
      new UniqueEntityID('recipient-1'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryRecipientsRepository.create(recipient)

    const result = await sut.execute({
      adminId: 'admin-1',
      recipientId: 'recipient-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveAdminsCanDeleteRecipientsError,
    )
    expect(result).toEqual(left(new OnlyActiveAdminsCanDeleteRecipientsError()))
    expect(await inMemoryRecipientsRepository.findById('recipient-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('recipient-1'),
        name: 'João Silva',
      }),
    )
  })

  it('should return an error if recipient does not exist', async () => {
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
      recipientId: 'recipient-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecipientNotFoundError)
    expect(result).toEqual(left(new RecipientNotFoundError()))
    expect(
      await inMemoryRecipientsRepository.findById('recipient-1'),
    ).toBeNull()
  })
})
