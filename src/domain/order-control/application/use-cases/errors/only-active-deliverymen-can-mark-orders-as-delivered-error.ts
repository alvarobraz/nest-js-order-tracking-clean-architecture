import { UseCaseError } from '@/core/errors/use-case-error'

export class OnlyActiveDeliverymenCanMarkOrdersAsDeliveredError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Only active deliverymen can mark orders as delivered')
  }
}
