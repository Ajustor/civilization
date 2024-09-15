import type { Gender } from '../people/enum'
import type { Lineage } from '../people/people'
import type { OccupationTypes } from '../people/work/enum'

export type PeopleEntity = {
  id: string
  name: string
  month: number
  occupation?: OccupationTypes
  lifeCounter: number
  isBuilding: boolean
  buildingMonthsLeft: number
  gender: Gender
  pregnancyMonthsLeft: number
  child: null | PeopleEntity
  lineage?: Lineage
}