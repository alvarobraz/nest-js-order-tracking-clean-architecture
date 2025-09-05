import { UseCaseError } from '@/core/errors/use-case-error'

export class DeliveryPhotoIsRequiredError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Delivery photo is required')
  }
}
