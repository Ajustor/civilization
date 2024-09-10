import { Citizen } from '../citizen/citizen'
import { Gender } from '../citizen/enum'
import type { OccupationTypes } from '../citizen/work/enum'
import type { CitizenEntity } from '../types/citizen'

export class CitizenBuilder {
  private citizenEntity: Citizen

  constructor() {
    this.citizenEntity = new Citizen('nope', 0, Gender.UNKNOWN)
  }

  withName(name: string): CitizenBuilder {
    this.citizenEntity.name = name
    return this
  }

  withMonth(month: number): CitizenBuilder {
    this.citizenEntity.month = month
    return this
  }

  withOccupation(occupation: OccupationTypes): CitizenBuilder {
    this.citizenEntity.setOccupation(occupation)
    return this
  }

  withLifeCounter(lifeCounter: number): CitizenBuilder {
    this.citizenEntity.lifeCounter = lifeCounter
    return this
  }

  withIsBuilding(isBuilding: boolean): CitizenBuilder {
    this.citizenEntity.isBuilding = isBuilding
    return this
  }

  withBuildingMonthsLeft(buildingMonthsLeft: number): CitizenBuilder {
    this.citizenEntity.buildingMonthsLeft = buildingMonthsLeft
    return this
  }

  withGender(gender: Gender): CitizenBuilder {
    this.citizenEntity.gender = gender
    return this
  }

  withPregnancyMonthsLeft(pregnancyMonthsLeft: number): CitizenBuilder {
    this.citizenEntity.pregnancyMonthsLeft = pregnancyMonthsLeft
    return this
  }

  withChild(child: CitizenEntity | null): CitizenBuilder {
    if (!child) {
      return this
    }
    const citizenBuilder = new CitizenBuilder()
      .withGender(child?.gender)
      .withLifeCounter(child.lifeCounter)
      .withName(child.name)

    if (child.occupation) {
      citizenBuilder.withOccupation(child.occupation)
    }
    this.citizenEntity.child = citizenBuilder.build()
    return this
  }

  build(): Citizen {
    return this.citizenEntity
  }
}