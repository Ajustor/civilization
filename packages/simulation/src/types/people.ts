import type { Gender } from '../people/enum'
import type { Lineage } from '../people/people'
import type { OccupationTypes } from '../people/work/enum'

export interface PeopleEntity {
  name: string
  month: number
  occupation?: OccupationTypes
  retired?: boolean
  lifeCounter: number
  isBuilding: boolean
  buildingMonthsLeft: number
  gender: Gender
  pregnancyMonthsLeft: number
  child: null | PeopleEntity
  lineage?: Lineage
}