export function intersect<T>(firstArray: T[], secondArray: T[]): T[] {
  return firstArray.filter((element) => secondArray.includes(element))
}

export function hasElementInCommon<T>(firstArray: T[], secondArray: T[]): boolean {
  return firstArray.some((element) => secondArray.includes(element))
}