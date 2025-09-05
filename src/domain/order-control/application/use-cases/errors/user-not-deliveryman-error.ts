export class UserNotDeliverymanError extends Error {
  constructor() {
    super('User is not a deliveryman')
  }
}
