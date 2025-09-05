import { UseCaseError } from '@/core/errors/use-case-error'

export class OnlyActiveDeliverymenCanPickUpOrdersError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Only active deliverymen can pick up orders')
  }
}
