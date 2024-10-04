import { range } from './range'

describe('range', () => {

  // Generates a sequence of numbers from start to end with default step of 1
  it('should generate a sequence from start to end with default step of 1', () => {
    const result = Array.from(range(1, 5))
    expect(result).toEqual([1, 2, 3, 4])
  })

  // Handles negative step values correctly
  it('should handle negative step values correctly', () => {
    const result = Array.from(range(5, 1, -1))
    expect(result).toEqual([5, 4, 3, 2])
  })

  // Returns an iterator object that can be used in a for...of loop
  it('should return the next value in the sequence until reaching the end', () => {
    const iterator = range(1, 5)
    const result = []
    for (const value of iterator) {
      result.push(value)
    }
    expect(result).toEqual([1, 2, 3, 4])
  })

  // Stops iteration when start is equal to or greater than end
  it('should stop iteration when start is equal to or greater than end', () => {
    const result = Array.from(range(5, 5))
    expect(result).toEqual([])
  })


  // Handles cases where step is larger than the difference between start and end
  it('should return a single value equal to end when step is larger than the difference between start and end', () => {
    const result = Array.from(range(1, 5, 10))
    expect(result).toEqual([1])
  })

  // Handles case where step is 0
  it('should throw an error when step is 0', () => {
    expect(() => range(1, 5, 0)).toThrow('Cannot set step to 0')
  })

  // Handles cases where start is greater than end
  it('should return an empty array when start is greater than end', () => {
    const result = Array.from(range(5, 1))
    expect(result).toEqual([])
  })

  // Ensures the iterator protocol is correctly implemented
  it('should return the next value in the sequence when calling next()', () => {
    const iterator = range(1, 5)
    expect(iterator.next()).toEqual({ value: 1, done: false })
    expect(iterator.next()).toEqual({ value: 2, done: false })
    expect(iterator.next()).toEqual({ value: 3, done: false })
    expect(iterator.next()).toEqual({ value: 4, done: false })
    expect(iterator.next()).toEqual({ value: 5, done: true })
  })

  // Checks if the function handles floating point numbers as step
  it('should handle floating point numbers as step', () => {
    const result = Array.from(range(1, 5, 0.5))
    expect(result).toEqual([1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5])
  })

  // Validates that the function does not modify the original start and end values
  it('should not modify original start and end values', () => {
    let start = 1
    let end = 5
    const iterator = range(start, end)
    iterator.next()
    expect(start).toEqual(1)
    expect(end).toEqual(5)
  })

  // Confirms that the function works with large ranges
  it('should generate a sequence from start to end with large range and step of 2', () => {
    const result = Array.from(range(1, 100, 2))
    const expected = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53, 55, 57, 59, 61, 63, 65, 67, 69, 71, 73, 75, 77, 79, 81, 83, 85, 87, 89, 91, 93, 95, 97, 99]
    expect(result).toEqual(expected)
  })
})
