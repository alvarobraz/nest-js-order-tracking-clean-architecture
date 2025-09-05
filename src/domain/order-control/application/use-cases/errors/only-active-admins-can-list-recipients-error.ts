import { UseCaseError } from '@/core/errors/use-case-error'

export class OnlyActiveAdminsCanListRecipientsError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Only active admins can list recipients')
  }
}
