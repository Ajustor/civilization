export function range(start: number, end: number, step = 1) {
  return {
    [Symbol.iterator]() {
      return this
    },
    next() {
      if (start < end) {
        const previousStart = start
        start = start + step
        return { value: previousStart, done: false }
      }
      return { done: true, value: end }
    }
  }
}