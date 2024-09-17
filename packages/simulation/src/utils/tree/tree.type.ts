export interface NodeInsertionData<T> {
  child: {
    key: string
    level: number
    source: T
  }
  parent: {
    key: string
  }
}
