import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Recipient } from '@/domain/order-control/enterprise/entities/recipient'
import { Recipient as PrismaRecipient } from '@prisma/client'

export class PrismaRecipientMapper {
  static toDomain(raw: PrismaRecipient): Recipient {
    return Recipient.create(
      {
        name: raw.name,
        street: raw.street,
        number: raw.number,
        neighborhood: raw.neighborhood,
        city: raw.city,
        state: raw.state,
        zipCode: raw.zipCode,
        phone: raw.phone,
        email: raw.email,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(recipient: Recipient): PrismaRecipient {
    return {
      id: recipient.id.toString(),
      userId: null,
      name: recipient.name,
      street: recipient.street,
      number: Number(recipient.number),
      neighborhood: recipient.neighborhood,
      city: recipient.city,
      state: recipient.state,
      zipCode: Number(recipient.zipCode),
      phone: recipient.phone,
      email: recipient.email,
      createdAt: recipient.createdAt,
      updatedAt: recipient.updatedAt ?? null,
    }
  }
}
