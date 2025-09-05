import { UseCaseError } from '@/core/errors/use-case-error'

export class OnlyActiveAdminsCanUpdateRecipientsError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Only active admins can update recipients')
  }
}
