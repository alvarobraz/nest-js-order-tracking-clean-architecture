import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateRecipientUseCase } from './update-recipient'
import { InMemoryRecipientsRepository } from 'test/repositories/in-memory-recipients-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeUser } from 'test/factories/make-users'
import { makeRecipient } from 'test/factories/make-recipient'
import { left } from '@/core/either'
import { OnlyActiveAdminsCanUpdateRecipientsError } from './errors/only-active-admins-can-update-recipients-error'
import { RecipientNotFoundError } from './errors/recipient-not-found-error'

let inMemoryRecipientsRepository: InMemoryRecipientsRepository
let inMemoryUsersRepository: InMemoryUsersRepository
let sut: UpdateRecipientUseCase

describe('Update Recipient Use Case', () => {
  beforeEach(() => {
    inMemoryRecipientsRepository = new InMemoryRecipientsRepository()
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new UpdateRecipientUseCase(
      inMemoryRecipientsRepository,
      inMemoryUsersRepository,
    )
  })

  it('should update recipient name if admin is valid and active', async () => {
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

    const result = await sut.execute({
      adminId: 'admin-1',
      recipientId: 'recipient-1',
      name: 'João Oliveira',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      recipient: expect.objectContaining({
        id: new UniqueEntityID('recipient-1'),
        name: 'João Oliveira',
        street: recipient.street,
        number: recipient.number,
        neighborhood: recipient.neighborhood,
        city: recipient.city,
        state: recipient.state,
        zipCode: recipient.zipCode,
        phone: recipient.phone,
        email: recipient.email,
      }),
    })
    expect(await inMemoryRecipientsRepository.findById('recipient-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('recipient-1'),
        name: 'João Oliveira',
        street: recipient.street,
        number: recipient.number,
      }),
    )
  })

  it('should update all recipient fields if admin is valid and active', async () => {
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

    const result = await sut.execute({
      adminId: 'admin-1',
      recipientId: 'recipient-1',
      name: 'Ana Costa',
      street: recipient.street,
      number: recipient.number,
      neighborhood: recipient.neighborhood,
      city: recipient.city,
      state: recipient.state,
      zipCode: recipient.zipCode,
      phone: recipient.phone,
      email: recipient.email,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      recipient: expect.objectContaining({
        id: new UniqueEntityID('recipient-1'),
        name: 'Ana Costa',
        street: recipient.street,
        number: recipient.number,
        neighborhood: recipient.neighborhood,
        city: recipient.city,
        state: recipient.state,
        zipCode: recipient.zipCode,
        phone: recipient.phone,
        email: recipient.email,
      }),
    })
    expect(await inMemoryRecipientsRepository.findById('recipient-1')).toEqual(
      expect.objectContaining({
        id: new UniqueEntityID('recipient-1'),
        name: 'Ana Costa',
        street: recipient.street,
        number: recipient.number,
        neighborhood: recipient.neighborhood,
        city: recipient.city,
        state: recipient.state,
        zipCode: recipient.zipCode,
        phone: recipient.phone,
        email: recipient.email,
      }),
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

    const result = await sut.execute({
      adminId: 'admin-1',
      recipientId: 'recipient-1',
      name: 'João Oliveira',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveAdminsCanUpdateRecipientsError,
    )
    expect(result).toEqual(left(new OnlyActiveAdminsCanUpdateRecipientsError()))
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
      name: 'João Oliveira',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveAdminsCanUpdateRecipientsError,
    )
    expect(result).toEqual(left(new OnlyActiveAdminsCanUpdateRecipientsError()))
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
      name: 'João Oliveira',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveAdminsCanUpdateRecipientsError,
    )
    expect(result).toEqual(left(new OnlyActiveAdminsCanUpdateRecipientsError()))
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
      name: 'João Oliveira',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecipientNotFoundError)
    expect(result).toEqual(left(new RecipientNotFoundError()))
    expect(
      await inMemoryRecipientsRepository.findById('recipient-1'),
    ).toBeNull()
  })
})
