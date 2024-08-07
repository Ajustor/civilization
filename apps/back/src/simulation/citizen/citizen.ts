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

export class Citizen {
  name: string
  age: number
  profession: Work | null = null
  lifeCounter: number
  isBuilding: boolean
  buildingYearsLeft: number

  constructor(name: string, age: number, lifeCounter: number = 3) {
    this.name = name
    this.age = age
    this.lifeCounter = lifeCounter
    this.isBuilding = false
    this.buildingYearsLeft = 0
  }

  setProfession(professionType: ProfessionType) {
    this.profession = new professions[professionType]()
  }

  ageOneYear(): void {
    this.age += 1
    if (this.isBuilding) {
      this.buildingYearsLeft -= 1
      if (this.buildingYearsLeft <= 0) {
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
    return this.lifeCounter > 0 && this.age < 90
  }

  collectResource(world: World, amount: number): boolean {
    if (!this.profession?.canWork(this.age)) {
      return false
    }

    return this.profession?.collectResources(world, amount) ?? false
  }

  startBuilding(): void {
    this.isBuilding = true
    this.buildingYearsLeft = 2
  }

  canReproduce(): boolean {
    return this.age > 16 && this.age < 60 && this.lifeCounter >= 8
  }

}
