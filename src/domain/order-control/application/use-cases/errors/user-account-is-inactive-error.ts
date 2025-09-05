import { UseCaseError } from '@/core/errors/use-case-error'

export class UserAccountIsInactiveError extends Error implements UseCaseError {
  constructor() {
    super('User account is inactive')
  }
}
