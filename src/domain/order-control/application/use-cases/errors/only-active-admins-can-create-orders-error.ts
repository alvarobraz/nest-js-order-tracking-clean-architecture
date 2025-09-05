import { UseCaseError } from '@/core/errors/use-case-error'

export class OnlyActiveAdminsCanCreateOrdersError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Only active admins can create orders')
  }
}
