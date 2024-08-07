// Resource.ts

export enum ResourceType {
  WOOD = 'wood',
  FOOD = 'food'
}

export class Resource {
  type: ResourceType
  quantity: number

  constructor(type: ResourceType, quantity: number) {
    this.type = type
    this.quantity = quantity
  }

  increase(quantity: number): void {
    this.quantity += quantity
  }

  decrease(quantity: number): void {
    if (this.quantity - quantity < 0) {
      this.quantity = 0
      return
    }
    this.quantity -= quantity
  }
}
