// Resource.ts

export enum ResourceType {
  WOOD = 'wood',
  FOOD = 'food'
}

export class Resource {

  constructor(private type: ResourceType, private quantity: number) {

  }

  getType(): ResourceType {
    return this.type
  }

  getQuantity(): number {
    return this.quantity
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
