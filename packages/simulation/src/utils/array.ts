export function intersect<T>(firstArray: T[], secondArray: T[]) {
  return firstArray.filter((element) => secondArray.includes(element))
}