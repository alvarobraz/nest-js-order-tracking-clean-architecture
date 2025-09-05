import { UseCaseError } from '@/core/errors/use-case-error'

export class OnlyActiveAdminsCanCreateDeliverymenError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Only active admins can create deliverymen')
  }
}
