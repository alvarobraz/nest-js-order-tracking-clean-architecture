import { describe, it, expect, beforeEach } from 'vitest'
import { CreateRecipientUseCase } from './create-recipient'
import { InMemoryRecipientsRepository } from 'test/repositories/in-memory-recipients-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { Recipient } from '@/domain/order-control/enterprise/entities/recipient'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeUser } from 'test/factories/make-users'
import { makeRecipient } from 'test/factories/make-recipient'
import { left } from '@/core/either'
import { OnlyActiveAdminsCanCreateRecipientsError } from './errors/only-active-admins-can-create-recipients-error'

let inMemoryRecipientsRepository: InMemoryRecipientsRepository
let inMemoryUsersRepository: InMemoryUsersRepository
let sut: CreateRecipientUseCase

describe('Create Recipient Use Case', () => {
  beforeEach(() => {
    inMemoryRecipientsRepository = new InMemoryRecipientsRepository()
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new CreateRecipientUseCase(
      inMemoryRecipientsRepository,
      inMemoryUsersRepository,
    )
  })

  it('should create a recipient if admin is valid and active', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'active',
      },
      new UniqueEntityID('admin-1'),
    )

    const userRecipient = makeUser(
      {
        role: 'recipient',
        status: 'active',
      },
      new UniqueEntityID('recipient-1'),
    )

    await inMemoryUsersRepository.create(admin)
    await inMemoryUsersRepository.create(userRecipient)

    const recipientProps = makeRecipient({
      name: 'João Silva',
    })

    const result = await sut.execute({
      userId: 'recipient-1',
      adminId: 'admin-1',
      name: recipientProps.name,
      street: 'Rua Carolina Castelli',
      number: 123,
      neighborhood: 'Novo Mundo',
      city: 'Curitiba',
      state: 'PR',
      zipCode: 81020430,
      phone: '(11) 91234-5678',
      email: 'joao.silva@example.com',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toMatchObject({
      recipient: expect.any(Recipient),
    })
    const recipient = (result.value as { recipient: Recipient }).recipient
    expect(recipient).toBeInstanceOf(Recipient)
    expect(recipient).toMatchObject({
      name: recipientProps.name,
      street: 'Rua Carolina Castelli',
      number: 123,
      neighborhood: 'Novo Mundo',
      city: 'Curitiba',
      state: 'PR',
      zipCode: 81020430,
      phone: '(11) 91234-5678',
      email: 'joao.silva@example.com',
    })
    expect(inMemoryRecipientsRepository.items).toHaveLength(1)
    expect(inMemoryRecipientsRepository.items[0].id).toEqual(recipient.id)
  })

  it('should return an error if admin does not exist', async () => {
    const recipientProps = makeRecipient({
      name: 'João Silva',
    })

    const userRecipient = makeUser(
      {
        role: 'recipient',
        status: 'active',
      },
      new UniqueEntityID('recipient-1'),
    )

    await inMemoryUsersRepository.create(userRecipient)

    const result = await sut.execute({
      userId: 'recipient-1',
      adminId: 'admin-1',
      name: recipientProps.name,
      street: 'Rua Oscar Kolbe',
      number: 123,
      neighborhood: 'Lindóia',
      city: 'Curitiba',
      state: 'PR',
      zipCode: 81010120,
      phone: '(11) 91234-5678',
      email: 'joao.silva@example.com',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveAdminsCanCreateRecipientsError,
    )
    expect(result).toEqual(left(new OnlyActiveAdminsCanCreateRecipientsError()))
  })

  it('should return an error if admin is not an admin', async () => {
    const deliveryman = makeUser(
      {
        role: 'deliveryman',
        status: 'active',
      },
      new UniqueEntityID('deliveryman-1'),
    )

    const userRecipient = makeUser(
      {
        role: 'recipient',
        status: 'active',
      },
      new UniqueEntityID('recipient-1'),
    )

    await inMemoryUsersRepository.create(userRecipient)
    await inMemoryUsersRepository.create(deliveryman)

    const recipientProps = makeRecipient({
      name: 'João Silva',
    })

    const result = await sut.execute({
      userId: 'recipient-1',
      adminId: 'deliveryman-1',
      name: recipientProps.name,
      street: 'Rua Cirilo Merlin',
      number: 123,
      neighborhood: 'Novo Mundo',
      city: 'Curitiba',
      state: 'PR',
      zipCode: 81020430,
      phone: '(11) 91234-5678',
      email: 'joao.silva@example.com',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveAdminsCanCreateRecipientsError,
    )
    expect(result).toEqual(left(new OnlyActiveAdminsCanCreateRecipientsError()))
  })

  it('should return an error if admin is inactive', async () => {
    const admin = makeUser(
      {
        role: 'admin',
        status: 'inactive',
      },
      new UniqueEntityID('admin-1'),
    )

    const userRecipient = makeUser(
      {
        role: 'recipient',
        status: 'active',
      },
      new UniqueEntityID('recipient-1'),
    )

    await inMemoryUsersRepository.create(userRecipient)
    await inMemoryUsersRepository.create(admin)

    const recipientProps = makeRecipient({
      name: 'João Silva',
    })

    const result = await sut.execute({
      userId: 'recipient-1',
      adminId: 'admin-1',
      name: recipientProps.name,
      street: 'Rua Reinaldo Gusso',
      number: 123,
      neighborhood: 'Capão Raso',
      city: 'Curitiba',
      state: 'PR',
      zipCode: 81020450,
      phone: '(11) 91234-5678',
      email: 'joao.silva@example.com',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(
      OnlyActiveAdminsCanCreateRecipientsError,
    )
    expect(result).toEqual(left(new OnlyActiveAdminsCanCreateRecipientsError()))
  })
})
