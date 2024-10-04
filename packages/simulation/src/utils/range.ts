export function range(start: number, end: number, step = 1) {

  if (step === 0) {
    throw new Error('Cannot set step to 0')
  }

  return {
    [Symbol.iterator]() {
      return this
    },
    next() {
      if (step === 0) {
        throw new Error('Cannot set step to 0')
      }

      if (start < end || (start > end && step < 0)) {
        const previousStart = start
        start = start + step
        return { value: previousStart, done: false }
      }
      return { done: true, value: end }
    }
  }
}