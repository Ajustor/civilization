import { isWithinChance } from './random'

describe('isWithinChance', () => {
  const mockMath = Object.create(global.Math)

  // Returns true when percentage is 100
  it('should return true when percentage is 100', () => {
    const result = isWithinChance(100)
    expect(result).toBe(true)
  })

  // Handles negative percentage values
  it('should return false when percentage is negative', () => {
    const result = isWithinChance(-10)
    expect(result).toBe(false)
  })

  // Returns false when percentage is 0
  it('should return false when percentage is 0', () => {
    const result = isWithinChance(0)
    expect(result).toBe(false)
  })

  // Returns false when percentage is near 0
  it('should return false when percentage is near 0', () => {
    const result = isWithinChance(0.1)
    expect(result).toBe(false)
  })

  // Returns true for percentage greater than a random number
  it('should return true when percentage is greater than random number', () => {
    mockMath.random = () => .5
    global.Math = mockMath
    const result = isWithinChance(50)
    expect(result).toBe(true)
  })

  // Handles percentage values greater than 100
  it('should return true when percentage is greater than 100', () => {
    const result = isWithinChance(150)
    expect(result).toBe(true)
  })

  // Handles percentage values as floating-point numbers
  it('should return true when percentage is 100', () => {
    const result = isWithinChance(100)
    expect(result).toBe(true)
  })

  // Handles percentage values as non-integer numbers
  it('should return true when percentage is 50.5', () => {
    mockMath.random = () => .5
    global.Math = mockMath
    const result = isWithinChance(50.5)
    expect(result).toBe(true)
  })

  // Handles percentage values as NaN
  it('should return false when percentage is NaN', () => {
    const result = isWithinChance(NaN)
    expect(result).toBe(false)
  })

  // Consistent results when Math.random is mocked to return fixed values
  it('should return true when percentage is 100', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5)
    const result = isWithinChance(100)
    expect(result).toBe(true)
    jest.restoreAllMocks()
  })

  // Handles very small percentage values close to zero
  it('should return false when percentage is close to zero', () => {
    const result = isWithinChance(Number.EPSILON)
    expect(result).toBe(false)
  })

  // Handles percentage values as Infinity
  it('should return true when percentage is Infinity', () => {
    const result = isWithinChance(Infinity)
    expect(result).toBe(true)
  })

  // Handles percentage values as undefined
  it('should return false when percentage is undefined', () => {
    const result = isWithinChance(undefined as unknown as number)
    expect(result).toBe(false)
  })
})
