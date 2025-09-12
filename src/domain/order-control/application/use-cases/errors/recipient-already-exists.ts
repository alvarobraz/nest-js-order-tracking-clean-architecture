import { UseCaseError } from '@/core/errors/use-case-error'

export class RecipientAlreadyExistsError extends Error implements UseCaseError {
  constructor() {
    super('Recipient already exists.')
  }
}
