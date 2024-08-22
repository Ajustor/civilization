// Citizen.ts
import type { World } from '../world'
import { Carpenter } from './work/carpenter'
import { ProfessionType } from './work/enum'
import { Farmer } from './work/farmer'
import type { Work } from './work/interface'

const professions = {
  [ProfessionType.CARPENTER]: Carpenter,
  [ProfessionType.FARMER]: Farmer
}

export type CitizenEntity = {
  id?: string
  name: string
  month: number
  profession?: ProfessionType
  lifeCounter: number
  isBuilding: boolean
  buildingMonthsLeft: number

}

export class Citizen {
  name: string
  month: number
  profession: Work | null = null
  lifeCounter: number
  isBuilding: boolean
  buildingMonthsLeft: number

  constructor(name: string, month: number, lifeCounter: number = 3, isBuilding = false, buildingMonthsLeft = 0) {
    this.name = name
    this.month = month
    this.lifeCounter = lifeCounter
    this.isBuilding = isBuilding
    this.buildingMonthsLeft = buildingMonthsLeft
  }

  setProfession(professionType: ProfessionType) {
    this.profession = new professions[professionType]()
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
    if (!this.profession?.canWork(this.years)) {
      return false
    }

    return this.profession?.collectResources(world, amount) ?? false
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
      profession: this.profession?.professionType
    }
  }

  [Symbol.toPrimitive](hint: string) {
    const formatedCitizen = {
      buildingMonthsLeft: this.buildingMonthsLeft,
      isBuilding: this.isBuilding,
      lifeCounter: this.lifeCounter,
      month: this.month,
      name: this.name,
      profession: this.profession?.professionType
    }

    if (hint === 'string') {
      return JSON.stringify(formatedCitizen)
    }

    return formatedCitizen
  }

}
