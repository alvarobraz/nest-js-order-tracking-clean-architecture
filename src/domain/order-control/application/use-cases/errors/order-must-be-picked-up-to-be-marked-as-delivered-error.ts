import { UseCaseError } from '@/core/errors/use-case-error'

export class OrderMustBePickedUpToBeMarkedAsDeliveredError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Order must be picked up to be marked as delivered')
  }
}
