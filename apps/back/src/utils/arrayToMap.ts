type ReturnTypeForMap<T, C> = C extends undefined ? T : C

export function arrayToMap<T, C = undefined>(
  items: T[],
  getId: (item: T) => string,
  transformValue?: (item: T) => C,
): Map<string, ReturnTypeForMap<T, C>> {
  return (items || []).reduce((itemsMap, item) => {
    itemsMap.set(getId(item), (transformValue ? transformValue(item) : item) as ReturnTypeForMap<T, C>)
    return itemsMap
  }, new Map<string, ReturnTypeForMap<T, C>>())
}

export function groupBy<T, C = undefined>(
  entities: T[],
  getId: (item: T) => string,
  transformValue?: (item: T) => C,
): Map<string, ReturnTypeForMap<T, C>[]> {
  return entities.reduce((dictionary: Map<string, ReturnTypeForMap<T, C>[]>, entity: T) => {
    const grouped = dictionary.get(getId(entity)) || []
    grouped.push((transformValue ? transformValue(entity) : entity) as ReturnTypeForMap<T, C>)
    dictionary.set(getId(entity), grouped)
    return dictionary
  }, new Map())
}

export function setValueInArrayMapWithoutDuplicates<MapValueType, MapKeyType>(
  aMap: Map<MapKeyType, MapValueType[]>,
  key: MapKeyType,
  valueToAdd: MapValueType,
  fnValueDoesntExist: (valuesToSearch: MapValueType[], searchedValue: MapValueType) => boolean = (valuesToSearch) =>
    valuesToSearch.indexOf(valueToAdd) === -1,
): Map<MapKeyType, MapValueType[]> {
  const values = aMap.get(key)
  if (values && fnValueDoesntExist(values, valueToAdd)) {
    values.push(valueToAdd)
  } else if (!values) {
    aMap.set(key, [valueToAdd])
  }
  return aMap
}
