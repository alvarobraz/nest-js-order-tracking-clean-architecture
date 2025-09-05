import { faker } from '@faker-js/faker/locale/pt_BR'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Order,
  OrderProps,
} from '@/domain/order-control/enterprise/entities/order'
import { OrderAttachmentList } from '@/domain/order-control/enterprise/entities/order-attachment-list'

export function makeOrder(
  override: Partial<OrderProps> = {},
  id?: UniqueEntityID,
) {
  const order = Order.create(
    {
      recipientId: new UniqueEntityID(),
      status: 'pending',
      street: faker.location.street(),
      number: faker.location.buildingNumber(),
      neighborhood: faker.location.secondaryAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode('#####-###'),
      deliveryPhoto: new OrderAttachmentList() || [],
      createdAt: new Date(),
      ...override,
    },
    id,
  )

  return order
}
