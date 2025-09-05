import { UseCaseError } from '@/core/errors/use-case-error'

export class OnlyAssignedDeliverymanOrAdminCanMarkOrderAsReturnedError
  extends Error
  implements UseCaseError
{
  constructor() {
    super(
      'Only the assigned deliveryman or an admin can mark the order as returned',
    )
  }
}
