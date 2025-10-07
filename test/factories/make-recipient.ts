// import { faker } from '@faker-js/faker/locale/pt_BR'
// import { UniqueEntityID } from '@/core/entities/unique-entity-id'
// import {
//   Recipient,
//   RecipientProps,
// } from '@/domain/order-control/enterprise/entities/recipient'

// export function makeRecipient(
//   override: Partial<RecipientProps> = {},
//   id?: UniqueEntityID,
// ) {
//   const recipient = Recipient.create(
//     {
//       name: faker.person.fullName(),
//       street: faker.location.street(),
//       number: faker.number.int(),
//       neighborhood: faker.location.secondaryAddress(),
//       city: faker.location.city(),
//       state: faker.location.state({ abbreviated: true }),
//       zipCode: faker.location.zipCode('#####-###'),
//       phone: faker.phone.number(),
//       email: faker.internet.email(),
//       createdAt: new Date(),
//       ...override,
//     },
//     id,
//   )

//   return recipient
// }

import { faker } from '@faker-js/faker/locale/pt_BR'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Recipient,
  RecipientProps,
} from '@/domain/order-control/enterprise/entities/recipient'

export function makeRecipient(
  override: Partial<RecipientProps> = {},
  id?: UniqueEntityID,
) {
  const recipient = Recipient.create(
    {
      userId: null,
      name: faker.person.fullName(),
      street: faker.location.street(),
      number: faker.number.int({ min: 1, max: 1000 }),
      neighborhood: faker.location.secondaryAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: Number(faker.location.zipCode('########')),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      createdAt: new Date(),
      ...override,
    },
    id,
  )

  return recipient
}
