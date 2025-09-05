export class OnlyActiveAdminsCanUpdateOrdersError extends Error {
  constructor() {
    super('Only active admins can update orders')
  }
}
