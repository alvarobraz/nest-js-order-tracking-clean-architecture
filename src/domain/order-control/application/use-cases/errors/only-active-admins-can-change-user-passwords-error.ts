import { UseCaseError } from '@/core/errors/use-case-error'

export class OnlyActiveAdminsCanChangeUserPasswordsError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Only active admins can change user passwords')
  }
}
