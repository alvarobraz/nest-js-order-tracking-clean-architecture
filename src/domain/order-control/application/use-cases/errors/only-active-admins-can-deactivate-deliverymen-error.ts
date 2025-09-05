import { UseCaseError } from '@/core/errors/use-case-error'

export class OnlyActiveAdminsCanDeactivateDeliverymenError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Only active admins can deactivate deliverymen')
  }
}
