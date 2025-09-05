import { UseCaseError } from '@/core/errors/use-case-error'

export class OnlyAssignedDeliverymanCanMarkOrderAsDeliveredError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Only the assigned deliveryman can mark the order as delivered')
  }
}
