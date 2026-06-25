import { canFulfill, applyResourceChanges } from './tradeLogic'

describe('canFulfill', () => {
  const stock = [{ resourceType: 'wood', quantity: 100 }]
  it('passes when stock covers the requirement', () => {
    expect(canFulfill(stock, [{ resourceType: 'wood', quantity: 100 }])).toBe(true)
  })
  it('fails when stock is insufficient or missing', () => {
    expect(canFulfill(stock, [{ resourceType: 'wood', quantity: 101 }])).toBe(false)
    expect(canFulfill(stock, [{ resourceType: 'stone', quantity: 1 }])).toBe(false)
  })
})

describe('applyResourceChanges', () => {
  it('adds gained and subtracts lost, clamping at 0, adding new types', () => {
    const out = applyResourceChanges(
      [{ resourceType: 'wood', quantity: 100 }],
      [{ resourceType: 'stone', quantity: 30 }],
      [{ resourceType: 'wood', quantity: 40 }],
    )
    const byType = Object.fromEntries(out.map((r) => [r.resourceType, r.quantity]))
    expect(byType.wood).toBe(60)
    expect(byType.stone).toBe(30)
  })
})
