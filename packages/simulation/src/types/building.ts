import type { BuildingTypes } from '../buildings/enum'

export type BuildingType = {
  id?: string
  type?: BuildingTypes
  capacity?: number
}

export interface Building {
  capacity?: number

  getType(): BuildingTypes
  formatToType(): BuildingType
}