import { UseCaseError } from '@/core/errors/use-case-error'

export class OnlyActiveAdminsCanDeleteOrdersError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Only active admins can delete orders')
  }
}
