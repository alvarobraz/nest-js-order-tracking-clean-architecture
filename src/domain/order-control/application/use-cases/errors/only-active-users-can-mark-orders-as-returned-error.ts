import { UseCaseError } from '@/core/errors/use-case-error'

export class OnlyActiveUsersCanMarkOrdersAsReturnedError
  extends Error
  implements UseCaseError
{
  constructor() {
    super('Only active users can mark orders as returned')
  }
}
