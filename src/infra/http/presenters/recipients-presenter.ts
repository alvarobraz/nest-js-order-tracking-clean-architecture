import { Recipient } from '@/domain/order-control/enterprise/entities/recipient'

export class RecipientPresenter {
  static toHTTP(recipient: Recipient) {
    return {
      id: recipient.id.toString(),

      name: recipient.name,
      street: recipient.street,
      number: recipient.number,
      neighborhood: recipient.neighborhood,
      city: recipient.city,
      state: recipient.state,
      zipCode: recipient.zipCode,
      phone: recipient.phone,
      email: recipient.email,
    }
  }
}
