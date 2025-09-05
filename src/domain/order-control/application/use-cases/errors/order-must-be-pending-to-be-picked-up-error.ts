import { UseCaseError } from '@/core/errors/use-case-error'

export class OrderMustBePendingToBePickedUpError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Order must be pending to be picked up')
  }
}
