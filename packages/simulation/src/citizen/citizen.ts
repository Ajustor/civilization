import { Carpenter } from './work/carpenter'
import type { CitizenEntity } from '../types/citizen'
// Citizen.ts
import type { CitizenType } from '..'
import { Farmer } from './work/farmer'
import type { Gender } from './enum'
import { OccupationTypes } from './work/enum'
import type { Work } from './work/interface'
import type { World } from '../world'

const occupations = {
  [OccupationTypes.CARPENTER]: Carpenter,
  [OccupationTypes.FARMER]: Farmer
}

const EAT_FACTOR = {
  [OccupationTypes.CARPENTER]: 3,
  [OccupationTypes.FARMER]: 2,
}

const PREGNANCY_MONTHS = 9

export class Citizen {
  name: string
  month: number
  work: Work | null = null
  lifeCounter: number
  isBuilding: boolean
  buildingMonthsLeft: number
  pregnancyMonthsLeft: number
  gender: Gender
  child: Citizen | null = null

  constructor(name: string, month: number, gender: Gender, lifeCounter: number = 3, isBuilding = false, buildingMonthsLeft = 0, pregnancyMonthsLeft = 0) {
    this.name = name
    this.month = month
    this.lifeCounter = lifeCounter
    this.isBuilding = isBuilding
    this.buildingMonthsLeft = buildingMonthsLeft
    this.gender = gender
    this.pregnancyMonthsLeft = pregnancyMonthsLeft
  }

  setOccupation(occupationType: OccupationTypes) {
    this.work = new occupations[occupationType]()
  }

  get years() {
    return ~~(this.month / 12)
  }

  ageOneMonth(): void {
    if (this.pregnancyMonthsLeft) {
      this.pregnancyMonthsLeft -= 1
    }

    this.month += 1
    if (this.isBuilding) {
      this.buildingMonthsLeft -= 1
      if (this.buildingMonthsLeft <= 0) {
        this.isBuilding = false
      }
    }
  }

  decreaseLife(): void {
    this.lifeCounter -= 1
  }

  increaseLife(amount: number): void {
    this.lifeCounter += amount
  }

  isAlive(): boolean {
    return this.lifeCounter > 0 && this.years < 90
  }

  collectResource(world: World, amount: number): boolean {
    if (!this.work?.canWork(this.years) && !this.isBuilding) {
      return false
    }

    return this.work?.collectResources(world, amount) ?? false
  }

  startBuilding(): void {
    this.isBuilding = true
    this.buildingMonthsLeft = 2
  }

  canReproduce(): boolean {
    return this.years > 16 && this.years < 60 && this.lifeCounter >= 8 && !this.child
  }

  addChildToBirth(child: Citizen) {
    this.child = child
    this.pregnancyMonthsLeft = PREGNANCY_MONTHS
  }

  giveBirth() {
    this.child = null
    this.pregnancyMonthsLeft = 0
  }

  formatToEntity(): CitizenEntity {
    return {
      buildingMonthsLeft: this.buildingMonthsLeft,
      isBuilding: this.isBuilding,
      lifeCounter: this.lifeCounter,
      month: this.month,
      name: this.name,
      occupation: this.work?.occupationType,
      gender: this.gender,
      pregnancyMonthsLeft: this.pregnancyMonthsLeft,
      child: this.child?.formatToEntity() ?? null
    }
  }

  formatToType(): CitizenType {
    return { ...this.formatToEntity(), years: this.years }
  }

  get eatFactor(): number {
    return this.work?.canWork(this.years) ? EAT_FACTOR[this.work.occupationType] : 1
  }

}
