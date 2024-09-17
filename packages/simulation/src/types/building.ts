import type { BuildingTypes } from '../buildings/enum'

export type BuildingType = {
  id?: string
  type?: BuildingTypes
  capacity?: number
  count: number
}

export interface Building {
  capacity?: number
  count: number

  getType(): BuildingTypes
  formatToType(): BuildingType
}