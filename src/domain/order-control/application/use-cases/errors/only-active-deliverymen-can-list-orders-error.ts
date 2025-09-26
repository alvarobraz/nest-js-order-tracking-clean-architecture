export class OnlyActiveDeliverymenCanListOrdersError extends Error {
  constructor() {
    super('Only active deliverymen can list their own orders')
  }
}
