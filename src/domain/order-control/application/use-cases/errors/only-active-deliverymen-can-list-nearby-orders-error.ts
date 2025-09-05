import { UseCaseError } from '@/core/errors/use-case-error'

export class OnlyActiveDeliverymenCanListNearbyOrdersError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Only active deliverymen can list nearby orders')
  }
}
