// Resource.ts

import type { ResourceType } from '.'

export enum ResourceTypes {
  WOOD = 'wood',
  FOOD = 'food'
}

export class Resource {

  constructor(private _type: ResourceTypes, private _quantity: number) {

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
    if (this._quantity - quantity < 0) {
      this._quantity = 0
      return
    }
    this._quantity -= quantity
  }

  formatToType(): ResourceType {
    return {
      quantity: this.quantity,
      type: this.type
    }
  }
}
