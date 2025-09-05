import { UseCaseError } from '@/core/errors/use-case-error'

export class ActiveDeliverymanNotFoundError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Active deliveryman not found')
  }
}
