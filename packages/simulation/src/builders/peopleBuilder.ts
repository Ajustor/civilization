import { Gender } from '../people/enum'
import type { OccupationTypes } from '../people/work/enum'
import { People, type Lineage } from '../people/people'
import type { PeopleEntity } from '../types/people'

export class PeopleBuilder {
  private peopleEntity: People

  constructor() {
    this.peopleEntity = new People({ month: 0, gender: Gender.UNKNOWN, lifeCounter: 0 })
  }

  withId(peopleId: string): PeopleBuilder {
    this.peopleEntity.id = peopleId
    return this
  }

  withMonth(month: number): PeopleBuilder {
    this.peopleEntity.month = month
    return this
  }

  withOccupation(occupation: OccupationTypes): PeopleBuilder {
    this.peopleEntity.setOccupation(occupation)
    return this
  }

  withLifeCounter(lifeCounter: number): PeopleBuilder {
    this.peopleEntity.lifeCounter = lifeCounter
    return this
  }

  withIsBuilding(isBuilding: boolean): PeopleBuilder {
    this.peopleEntity.isBuilding = isBuilding
    return this
  }

  withBuildingMonthsLeft(buildingMonthsLeft: number): PeopleBuilder {
    this.peopleEntity.buildingMonthsLeft = buildingMonthsLeft
    return this
  }

  withGender(gender: Gender): PeopleBuilder {
    this.peopleEntity.gender = gender
    return this
  }

  withPregnancyMonthsLeft(pregnancyMonthsLeft: number): PeopleBuilder {
    this.peopleEntity.pregnancyMonthsLeft = pregnancyMonthsLeft
    return this
  }

  withChild(child: PeopleEntity | null): PeopleBuilder {
    if (!child) {
      return this
    }
    const peopleBuilder = new PeopleBuilder()
      .withGender(child?.gender)
      .withLifeCounter(child.lifeCounter)

    if (child.occupation) {
      peopleBuilder.withOccupation(child.occupation)
    }

    if (child.lineage) {
      peopleBuilder.withLineage(child.lineage)
    }

    this.peopleEntity.child = peopleBuilder.build()
    return this
  }

  withLineage(lineage: Lineage): PeopleBuilder {
    this.peopleEntity.lineage = lineage
    return this
  }

  build(): People {
    return this.peopleEntity
  }
}