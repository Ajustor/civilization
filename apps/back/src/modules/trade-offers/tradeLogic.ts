export type ResourceAmount = { resourceType: string; quantity: number }
export type ResourceStock = { resourceType: string; quantity: number }

/** True if `stock` holds at least every resource amount in `required`. */
export function canFulfill(
  stock: ResourceStock[],
  required: ResourceAmount[],
): boolean {
  return required.every((req) => {
    const held = stock.find((s) => s.resourceType === req.resourceType)
    return (held?.quantity ?? 0) >= req.quantity
  })
}

/**
 * Returns a new stock list after adding `gained` and removing `lost`.
 * Quantities never go below 0. Resource types absent from `stock` are added.
 */
export function applyResourceChanges(
  stock: ResourceStock[],
  gained: ResourceAmount[],
  lost: ResourceAmount[],
): ResourceStock[] {
  const result = new Map<string, number>()
  for (const s of stock) result.set(s.resourceType, s.quantity)
  for (const g of gained)
    result.set(g.resourceType, (result.get(g.resourceType) ?? 0) + g.quantity)
  for (const l of lost)
    result.set(
      l.resourceType,
      Math.max(0, (result.get(l.resourceType) ?? 0) - l.quantity),
    )
  return [...result].map(([resourceType, quantity]) => ({ resourceType, quantity }))
}
