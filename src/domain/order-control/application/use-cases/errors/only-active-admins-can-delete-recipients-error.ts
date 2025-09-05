import { UseCaseError } from '@/core/errors/use-case-error'

export class OnlyActiveAdminsCanDeleteRecipientsError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Only active admins can delete recipients')
  }
}
