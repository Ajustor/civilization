import type { PeopleEntity, PeopleType } from '..'

import { Carpenter } from './work/carpenter'
import { Farmer } from './work/farmer'
import type { Gender } from './enum'
import { OccupationTypes } from './work/enum'
import { Tree } from '../utils/tree/tree'
// People.ts
import type { Work } from './work/interface'
import type { World } from '../world'
import { v4 } from 'uuid'

const occupations = {
  [OccupationTypes.CARPENTER]: Carpenter,
  [OccupationTypes.FARMER]: Farmer
}

const EAT_FACTOR = {
  [OccupationTypes.CARPENTER]: 3,
  [OccupationTypes.FARMER]: 2,
}

const PREGNANCY_MONTHS = 9
const MINIMUM_CONCEPTION_AGE = 16
const MAXIMUM_CONCEPTION_AGE = 60
const MINIMUM_CONCEPTION_HEALTH = 8


export type PeopleConstructorParams = {
  name: string,
  month: number,
  gender: Gender,
  lifeCounter: number
  isBuilding?: boolean
  buildingMonthsLeft?: number
  pregnancyMonthsLeft?: number
  lineage?: Lineage
}

// renommer
export type Lineage = {
  mother: {
    id: string
    lineage?: Lineage
  }
  father: {
    id: string
    lineage?: Lineage
  }
}
export class People {
  public id!: string
  name: string
  month: number
  work: Work | null = null
  lifeCounter: number
  isBuilding: boolean
  buildingMonthsLeft: number
  pregnancyMonthsLeft: number
  gender: Gender
  child: People | null = null
  lineage?: Lineage

  tree: Tree<string> | null = null

  constructor({
    name,
    month,
    gender,
    lifeCounter = 3,
    isBuilding = false,
    buildingMonthsLeft  = 0,
    pregnancyMonthsLeft = 0,
    lineage
  }: PeopleConstructorParams) {
    this.id = v4()
    this.name = name
    this.month = month
    this.lifeCounter = lifeCounter
    this.isBuilding = isBuilding
    this.buildingMonthsLeft = buildingMonthsLeft
    this.gender = gender
    this.pregnancyMonthsLeft = pregnancyMonthsLeft
    this.lineage = lineage
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

  canConceive(): boolean {
    return this.years > MINIMUM_CONCEPTION_AGE && this.years < MAXIMUM_CONCEPTION_AGE && this.lifeCounter >= MINIMUM_CONCEPTION_HEALTH && !this.child
  }

  addChildToBirth(child: People) {
    this.child = child
    this.pregnancyMonthsLeft = PREGNANCY_MONTHS
  }

  giveBirth() {
    this.child = null
    this.pregnancyMonthsLeft = 0
  }

  buildLineageTree() {
    this.tree = new Tree<string>(this.id, this.id)
    if (this.lineage) {
      this.addLineageInTree(this.lineage, this.id, 0)
    }
  }

  private addLineageInTree({ father, mother }: Lineage, parentKey: string, parentLevel: number) {
    const level = parentLevel + 1

    this.tree?.insert({
      child: {
        key: father.id,
        source: father.id,
        level,
      },
      parent: {
        key: parentKey,
      }
    })

    this.tree?.insert({
      child: {
        key: mother.id,
        source: mother.id,
        level,
      },
      parent: {
        key: parentKey,
      }
    })

    if (father.lineage) {
      this.addLineageInTree(father.lineage, father.id, level)
    }

    if (mother.lineage) {
      this.addLineageInTree(mother.lineage, mother.id, level)
    }
  }

  formatToEntity(): PeopleEntity {
    return {
      id: this.id,
      buildingMonthsLeft: this.buildingMonthsLeft,
      isBuilding: this.isBuilding,
      lifeCounter: this.lifeCounter,
      month: this.month,
      name: this.name,
      occupation: this.work?.occupationType,
      gender: this.gender,
      pregnancyMonthsLeft: this.pregnancyMonthsLeft,
      child: this.child?.formatToEntity() ?? null,
      ...(this.lineage && { lineage: this.lineage }),
    }
  }

  formatToType(): PeopleType {
    return { ...this.formatToEntity(), years: this.years }
  }

  get eatFactor(): number {
    return this.work?.canWork(this.years) ? EAT_FACTOR[this.work.occupationType] : 1
  }

}
