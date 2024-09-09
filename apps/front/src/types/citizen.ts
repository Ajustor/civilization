import type { OccupationType } from './occupation'

export enum Gender {
  FEMALE = 'female',
  MALE = 'male',
  UNKNOWN = 'unknown'
}

export type Citizen = {
  occupation: OccupationType | undefined
  gender: Gender
  years: number
  name: string
  month: number
  lifeCounter: number
  isBuilding: boolean
  buildingMonthsLeft: number
}