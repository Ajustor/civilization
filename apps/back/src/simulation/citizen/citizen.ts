import { Carpenter } from './work/carpenter'
import { Farmer } from './work/farmer'
import { Gender } from './enum'
import { OccupationType } from './work/enum'
import type { Work } from './work/interface'
// Citizen.ts
import type { World } from '../world'

const works = {
  [OccupationType.CARPENTER]: Carpenter,
  [OccupationType.FARMER]: Farmer
}

export type CitizenEntity = {
  id?: string
  name: string
  month: number
  occupation?: OccupationType
  profession?: OccupationType // keep it until all civilisations are renewed
  gender: Gender
  lifeCounter: number
  isBuilding: boolean
  buildingMonthsLeft: number

}

export class Citizen {
  name: string
  month: number
  work: Work | null = null
  lifeCounter: number
  isBuilding: boolean
  buildingMonthsLeft: number
  gender:  Gender

  constructor(name: string, month: number, gender: Gender, lifeCounter: number = 3, isBuilding = false, buildingMonthsLeft = 0) {
    this.name = name
    this.month = month
    this.lifeCounter = lifeCounter
    this.isBuilding = isBuilding
    this.buildingMonthsLeft = buildingMonthsLeft
    this.gender = gender
  }

  setOccupation(occupationType: OccupationType) {
    this.work = new works[occupationType]()
  }

  get years() {
    return ~~(this.month / 12)
  }

  ageOneMonth(): void {
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
    return this.years > 16 && this.years < 60 && this.lifeCounter >= 8
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
      
    }
  }

  [Symbol.toPrimitive](hint: string) {
    const formatedCitizen = {
      buildingMonthsLeft: this.buildingMonthsLeft,
      isBuilding: this.isBuilding,
      lifeCounter: this.lifeCounter,
      years: this.years,
      month: this.month % 12,
      name: this.name,
      occupation: this.work?.occupationType,
      gender: this.gender
    }

    if (hint === 'string') {
      return JSON.stringify(formatedCitizen)
    }

    return formatedCitizen
  }

}
