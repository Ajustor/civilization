import type { Civilization, PeopleEntity, PeopleType } from '..'

import { Carpenter } from './work/carpenter'
import { Farmer } from './work/farmer'
import type { Gender } from './enum'
import { OccupationTypes } from './work/enum'
import { Retired } from './work/retired'
import { Tree } from '../utils/tree/tree'
import { isCollectWork, type Work } from './work/interface'
// People.ts
import type { UpgradedWork } from './work/interface'
import type { World } from '../world'
import { isWithinChance } from '../utils'
import { WoodCutter } from './work/woodCutter'
import { CharcoalBurner } from './work/charcoalBurner'
import { Gatherer } from './work/gatherer'
import { Child } from './work/child'
import { Miner } from './work/miner'
import { KitchenAssistant } from './work/kitchenAssistant'

const occupations = {
  [OccupationTypes.CARPENTER]: Carpenter,
  [OccupationTypes.FARMER]: Farmer,
  [OccupationTypes.RETIRED]: Retired,
  [OccupationTypes.WOODCUTTER]: WoodCutter,
  [OccupationTypes.CHARCOAL_BURNER]: CharcoalBurner,
  [OccupationTypes.GATHERER]: Gatherer,
  [OccupationTypes.CHILD]: Child,
  [OccupationTypes.MINER]: Miner,
  [OccupationTypes.KITCHEN_ASSISTANT]: KitchenAssistant,
}

export const EAT_FACTOR = {
  [OccupationTypes.MINER]: 3,
  [OccupationTypes.CARPENTER]: 3,
  [OccupationTypes.FARMER]: 3,
  [OccupationTypes.CHARCOAL_BURNER]: 3,
  [OccupationTypes.WOODCUTTER]: 2,
  [OccupationTypes.KITCHEN_ASSISTANT]: 2,
  [OccupationTypes.GATHERER]: 2,
  [OccupationTypes.RETIRED]: 1,
  [OccupationTypes.CHILD]: 1,
}

export const MINIMUM_CONCEPTION_AGE = 16
const PREGNANCY_MONTHS = 9
const MAXIMUM_CONCEPTION_AGE = 50
const MINIMUM_CONCEPTION_HEALTH = 8
const MAX_NUMBER_OF_CHILD = 3

export const LIFE_EXPECTANCY = 85
const DEATH_RATE_AFTER_EXPECTANCY = 20

export const MAX_LIFE = 12

export const MINIMAL_AGE_TO_WORK = 4

export type PeopleConstructorParams = {
  month: number
  gender: Gender
  lifeCounter: number
  isBuilding?: boolean
  buildingMonthsLeft?: number
  pregnancyMonthsLeft?: number
  lineage?: Lineage
  numberOfChild?: number
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
  month: number
  work: Work | UpgradedWork | null = null
  lifeCounter: number
  isBuilding: boolean
  buildingMonthsLeft: number
  pregnancyMonthsLeft: number
  gender: Gender
  child: People | null = null
  lineage?: Lineage
  numberOfChild: number
  public hasWork: boolean = false

  tree: Tree<string> | null = null

  constructor({
    month,
    gender,
    lifeCounter = 3,
    isBuilding = false,
    buildingMonthsLeft = 0,
    pregnancyMonthsLeft = 0,
    lineage,
    numberOfChild = 0,
  }: PeopleConstructorParams) {
    this.month = month
    this.lifeCounter = lifeCounter
    this.isBuilding = isBuilding
    this.buildingMonthsLeft = buildingMonthsLeft
    this.gender = gender
    this.pregnancyMonthsLeft = pregnancyMonthsLeft
    this.lineage = lineage
    this.numberOfChild = numberOfChild
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

  decreaseLife(amount = 1): void {
    this.lifeCounter -= amount
  }

  increaseLife(amount: number): void {
    this.lifeCounter = Math.min(MAX_LIFE, this.lifeCounter + amount)
  }

  isAlive(): boolean {
    return (
      this.lifeCounter > 0 &&
      (this.years < LIFE_EXPECTANCY ||
        !isWithinChance(DEATH_RATE_AFTER_EXPECTANCY))
    )
  }

  collectResource(world: World, civilization: Civilization): boolean {
    if (!this.work?.canWork(this.years) && !this.isBuilding) {
      return false
    }

    if (!this.work) {
      return false
    }

    if (isCollectWork(this.work)) {
      return this.work.collectResources(world, civilization) ?? false
    }
    return false
  }

  startBuilding(buildingMonthsLeft = 2): void {
    this.isBuilding = true
    this.buildingMonthsLeft = buildingMonthsLeft
  }

  canConceive(): boolean {
    return (
      this.numberOfChild <= MAX_NUMBER_OF_CHILD &&
      this.years > MINIMUM_CONCEPTION_AGE &&
      this.years < MAXIMUM_CONCEPTION_AGE &&
      this.lifeCounter >= MINIMUM_CONCEPTION_HEALTH &&
      !this.child
    )
  }

  canRetire(): boolean {
    return this.work?.canRetire(this.years) ?? false
  }

  canWork(): boolean {
    return (
      !this.hasWork &&
      !this.isBuilding &&
      (this.work?.canWork(this.years) ?? false)
    )
  }

  canUpgradeWork(): boolean {
    return (
      this.years >= MINIMAL_AGE_TO_WORK &&
      (this.work?.canUpgrade(this.years) ?? false)
    )
  }

  addChildToBirth(child: People) {
    this.numberOfChild++
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

  private addLineageInTree(
    { father, mother }: Lineage,
    parentKey: string,
    parentLevel: number,
  ) {
    const level = parentLevel + 1

    if (father) {
      this.tree?.insert({
        child: {
          key: father.id,
          source: father.id,
          level,
        },
        parent: {
          key: parentKey,
        },
      })
    }

    if (mother) {
      this.tree?.insert({
        child: {
          key: mother.id,
          source: mother.id,
          level,
        },
        parent: {
          key: parentKey,
        },
      })
    }

    if (father?.lineage) {
      this.addLineageInTree(father.lineage, father.id, level)
    }

    if (mother?.lineage) {
      this.addLineageInTree(mother.lineage, mother.id, level)
    }
  }

  getDirectLineage(): string[] {
    const result = []
    if (this.lineage) {
      if (this.lineage.father) {
        result.push(this.lineage.father.id)
        if (this.lineage.father.lineage) {
          result.push(
            this.lineage.father.lineage.father.id,
            this.lineage.father.lineage.mother.id,
          )
        }
      }

      if (this.lineage.mother) {
        result.push(this.lineage.mother.id)
        if (this.lineage.mother.lineage) {
          result.push(
            this.lineage.mother.lineage.father.id,
            this.lineage.mother.lineage.mother.id,
          )
        }
      }
    }
    return result
  }

  formatToEntity(): PeopleEntity {
    return {
      buildingMonthsLeft: this.buildingMonthsLeft,
      isBuilding: this.isBuilding,
      lifeCounter: this.lifeCounter,
      month: this.month,
      occupation: this.work?.occupationType,
      gender: this.gender,
      pregnancyMonthsLeft: this.pregnancyMonthsLeft,
      child: this.child?.formatToEntity() ?? null,
      numberOfChild: this.numberOfChild,
      ...(this.lineage && { lineage: this.lineage }),
    }
  }

  formatToType(): PeopleType {
    return { ...this.formatToEntity(), years: this.years, id: this.id }
  }

  get eatFactor(): number {
    return this.work?.canWork(this.years)
      ? EAT_FACTOR[this.work.occupationType]
      : 1
  }
}
