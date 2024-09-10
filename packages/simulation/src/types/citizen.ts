import type { Gender } from '../citizen/enum'
import type { OccupationTypes } from '../citizen/work/enum'

export type CitizenEntity = {
  id?: string
  name: string
  month: number
  occupation?: OccupationTypes
  lifeCounter: number
  isBuilding: boolean
  buildingMonthsLeft: number
  gender: Gender
  pregnancyMonthsLeft: number
  child: null | CitizenEntity
}