import type { Gender } from '../citizen/enum'
import type { OccupationTypes } from '../citizen/work/enum'

export type CitizenEntity = {
  id?: string
  name: string
  month: number
  profession?: OccupationTypes
  occupation?: OccupationTypes
  lifeCounter: number
  isBuilding: boolean
  buildingMonthsLeft: number
  gender: Gender
}