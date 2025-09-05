import { UseCaseError } from '@/core/errors/use-case-error'

export class OnlyActiveAdminsCanListOrdersError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Only active admins can list orders')
  }
}
