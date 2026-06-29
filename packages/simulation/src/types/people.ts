import type { Gender } from '../people/enum'
import type { Lineage } from '../people/people'
import type { OccupationTypes } from '../people/work/enum'
import type { BuildingTypes } from '../buildings/enum'

export interface PeopleEntity {
  name?: string
  month: number
  occupation?: OccupationTypes
  lifeCounter: number
  isBuilding: boolean
  buildingMonthsLeft: number
  // Which building this person is currently constructing (null when not on a
  // construction site). Lets the UI show who builds what.
  buildingType?: BuildingTypes | null
  gender: Gender
  pregnancyMonthsLeft: number
  child: null | PeopleEntity
  lineage?: Lineage
  numberOfChild?: number
  originCivilizationId?: string
}