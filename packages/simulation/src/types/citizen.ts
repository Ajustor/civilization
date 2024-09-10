import type { ProfessionTypes } from '../citizen/work/enum'

export type CitizenEntity = {
  id?: string
  name: string
  month: number
  profession?: ProfessionTypes
  lifeCounter: number
  isBuilding: boolean
  buildingMonthsLeft: number
}