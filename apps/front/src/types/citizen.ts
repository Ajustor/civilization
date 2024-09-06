import type { ProfessionType } from './profession'

export type Citizen = {
  profession: ProfessionType | undefined
  years: number
  name: string
  month: number
  lifeCounter: number
  isBuilding: boolean
  buildingMonthsLeft: number
}