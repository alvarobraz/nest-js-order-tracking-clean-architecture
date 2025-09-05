import { UseCaseError } from '@/core/errors/use-case-error'

export class OnlyActiveAdminsCanMarkOrdersAsPendingError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Only active admins can mark orders as pending')
  }
}
