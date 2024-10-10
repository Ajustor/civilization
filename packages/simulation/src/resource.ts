import type { ResourceType } from '.'

export enum ResourceTypes {
  WOOD = 'wood',
  FOOD = 'food',
  STONE = 'stone',
  PLANK = 'plank',
  CHARCOAL = 'charcoal'
}

export class Resource {

  constructor(private _type: ResourceTypes, private _quantity: number) {
    if (!Object.values(ResourceTypes).includes(_type)) {
      throw new Error('Resource not implemented')
    }

    if (isNaN(_quantity)) {
      throw new Error('Quantity is not a number')
    }

    this._quantity = Math.max(_quantity, 0)
  }

  get type(): ResourceTypes {
    return this._type
  }

  get quantity(): number {
    return this._quantity
  }

  increase(quantity: number): void {
    this._quantity += quantity
  }

  decrease(quantity: number): void {
    this._quantity = Math.max(this._quantity - quantity, 0)
  }

  formatToType(): ResourceType {
    return {
      quantity: this.quantity,
      type: this.type
    }
  }
}
