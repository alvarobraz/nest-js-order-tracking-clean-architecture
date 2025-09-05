import { UseCaseError } from '@/core/errors/use-case-error'

export class OnlyActiveAdminsCanUpdateDeliverymenError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Only active admins can update deliverymen')
  }
}
