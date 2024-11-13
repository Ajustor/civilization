import { Resource, ResourceTypes } from './resource'
import { countries, uniqueNamesGenerator } from 'unique-names-generator'

import {
  AbstractExtractionBuilding,
  ExtractionBuilding,
  type Building,
  type ConstructionCost,
  type ProductionBuilding,
  type WorkerRequiredToBuild,
} from './types/building'
import { BuildingTypes } from './buildings/enum'
import { Gender } from './people/enum'
import { House } from './buildings/house'
import { OccupationTypes } from './people/work/enum'
import { People } from './people/people'
import type { World } from './world'
import { hasElementInCommon } from './utils/array'
import { isWithinChance } from './utils'
import { v4 } from 'uuid'
import { OCCUPATION_TREE } from './technology/occupationTree'
import { getRandomInt } from './utils/random'
import { Kiln } from './buildings/kiln'
import { Sawmill } from './buildings/sawmill'
import { Farm } from './buildings/farm'
import { Mine } from './buildings/mine'
import { isExtractionOrProductionBuilding } from './buildings'
import { Campfire } from './buildings/campfire'

const PREGNANCY_PROBABILITY = 60
const MAX_ACTIVE_PEOPLE_BY_CIVILIZATION = 100_000
const PEOPLE_CHARCOAL_CAN_HEAT = 10
const CHANCE_TO_EVOLVE = 20
const CHANCE_TO_BUILD_EVOLVED_BUILDING = 25

const BUILDING_CONSTRUCTORS = {
  [BuildingTypes.FARM]: Farm,
  [BuildingTypes.KILN]: Kiln,
  [BuildingTypes.HOUSE]: House,
  [BuildingTypes.SAWMILL]: Sawmill,
  [BuildingTypes.CAMPFIRE]: Campfire,
  [BuildingTypes.MINE]: Mine,
}

const EXTRACTIONS_RESOURCES: { [key in BuildingTypes]?: ResourceTypes[] } = {
  [BuildingTypes.MINE]: [ResourceTypes.STONE],
}

const EXTRACTIONS_BUILDINGS = [BuildingTypes.MINE]

export const isExtractionBuilding = (
  building: Building,
): building is AbstractExtractionBuilding =>
  EXTRACTIONS_BUILDINGS.includes(building.getType())

export class Civilization {
  public id = v4()
  private _people: People[]
  private _resources: Resource[]
  private _livedMonths: number = 0
  private _buildings: Building[]
  private _citizensCount: number = 0

  constructor(
    public name = uniqueNamesGenerator({ dictionaries: [countries] }),
  ) {
    this._people = []
    this._resources = []
    this._buildings = []
  }

  nobodyAlive(): boolean {
    return this._people.length === 0
  }

  get citizensCount(): number {
    return this._people.length || this._citizensCount
  }

  set citizensCount(citizenCount: number) {
    this._citizensCount = citizenCount
  }

  get livedMonths(): number {
    return this._livedMonths
  }

  set livedMonths(livedMonths: number) {
    this._livedMonths = livedMonths
  }

  get people(): People[] {
    return this._people
  }

  set people(people: People[]) {
    this._people = people
  }

  get resources(): Resource[] {
    return this._resources
  }

  set resources(resources: Resource[]) {
    this._resources = resources
  }

  get buildings(): Building[] {
    return this._buildings
  }

  get houses(): House | undefined {
    return this.buildings.find<House>(
      (building): building is House =>
        building.getType() === BuildingTypes.HOUSE,
    )
  }

  get sawmill(): Sawmill | undefined {
    return this.buildings.find<Sawmill>(
      (building): building is Sawmill =>
        building.getType() === BuildingTypes.SAWMILL,
    )
  }

  get mine(): Mine | undefined {
    return this.buildings.find<Mine>(
      (building): building is Mine => building.getType() === BuildingTypes.MINE,
    )
  }

  get kiln(): Kiln | undefined {
    return this.buildings.find<Kiln>(
      (building): building is Kiln => building.getType() === BuildingTypes.KILN,
    )
  }

  get farm(): Farm | undefined {
    return this.buildings.find<Farm>(
      (building): building is Farm => building.getType() === BuildingTypes.FARM,
    )
  }

  get campfire(): Campfire | undefined {
    return this.buildings.find<Campfire>(
      (building): building is Campfire =>
        building.getType() === BuildingTypes.CAMPFIRE,
    )
  }

  set houses(house: House) {
    this.buildings.push(house)
  }

  private getWorkerSpaceLeft(workerType: OccupationTypes): number {
    const peopleWithOccupation = this.getPeopleWithOccupation(workerType).length
    return (
      this.buildings.reduce((space, building) => {
        if (isExtractionOrProductionBuilding(building)) {
          const requiredWorker = building.workerTypeRequired.filter(
            (worker) => worker.occupation === workerType,
          )
          if (!requiredWorker.length) {
            return space
          }
          space +=
            requiredWorker.reduce((sum, { count }) => sum + count, 0) *
            building.count
        }
        return space
      }, 0) - peopleWithOccupation
    )
  }

  increaseResource(type: ResourceTypes, count: number) {
    const resource = this._resources.find((resource) => type === resource.type)
    if (!resource) {
      this._resources.push(new Resource(type, count))
    } else {
      resource.increase(count)
    }
  }

  decreaseResource(type: ResourceTypes, count: number) {
    const resource = this._resources.find((resource) => type === resource.type)

    if (!resource) {
      this._resources.push(new Resource(type, 0))
    } else {
      resource.decrease(count)
    }
  }

  getResource(type: ResourceTypes): Resource {
    let resource = this._resources.find((resource) => resource.type === type)

    if (!resource) {
      resource = new Resource(type, 0)
      this.addResource(resource)
    }

    return resource
  }

  getPeopleWithOccupation(occupation: OccupationTypes): People[] {
    return this._people.filter(
      ({ work: peopleJob }) =>
        peopleJob && occupation === peopleJob.occupationType,
    )
  }

  getPeopleOlderThan(age: number): People[] {
    return this._people.filter(({ years }) => years >= age)
  }

  removePeople(citizenIds: string[]) {
    this._people = this._people.filter(({ id }) => !citizenIds.includes(id))
  }

  getPeopleWithoutOccupation(occupation: OccupationTypes): People[] {
    return this._people.filter(
      ({ work: peopleJob }) =>
        peopleJob && occupation !== peopleJob.occupationType,
    )
  }

  getWorkersWhoCanRetire(): People[] {
    return this._people.filter((worker) => worker.canRetire())
  }

  getWorkersWhoCanUpgrade(): People[] {
    return this._people.filter(
      (worker) =>
        worker.work && OCCUPATION_TREE[worker.work.occupationType]?.length,
    )
  }

  addPeople(...peoples: People[]): void {
    for (const people of peoples) {
      this._people.push(people)
    }
  }

  addResource(...resources: Resource[]): void {
    this._resources.push(...resources)
  }

  addBuilding(...buildings: Building[]): void {
    this._buildings.push(...buildings)
  }

  constructBuilding(type: BuildingTypes): void {
    const existingBuilding = this.buildings.find(
      (building) => building.getType() === type,
    )

    if (!existingBuilding) {
      const newBuilding = new BUILDING_CONSTRUCTORS[type](1)

      if (isExtractionBuilding(newBuilding)) {
        const buildingType = newBuilding.getType()
        newBuilding.generateOutput(
          (buildingType in EXTRACTIONS_RESOURCES &&
            EXTRACTIONS_RESOURCES[buildingType]) ||
          [],
        )
      }
      this.addBuilding(newBuilding)
      return
    }

    if (isExtractionBuilding(existingBuilding)) {
      const buildingType = existingBuilding.getType()
      existingBuilding.generateOutput(
        (buildingType in EXTRACTIONS_RESOURCES &&
          EXTRACTIONS_RESOURCES[buildingType]) ||
        [],
      )
    }

    existingBuilding.count++
  }

  private collectResource(workers: People[], world: World): Promise<null> {
    return new Promise((resolve) => {
      for (const worker of workers) {
        worker.collectResource(world, this)
      }
      resolve(null)
    })
  }

  private async resourceConsumption(
    world: World,
    people: People[],
  ): Promise<void> {
    const civilizationFood = this.getResource(ResourceTypes.RAW_FOOD)
    const civilizationCookedFood = this.getResource(ResourceTypes.COOKED_FOOD)
    const civilizationWood = this.getResource(ResourceTypes.WOOD)
    const civilizationCharcoal = this.getResource(ResourceTypes.CHARCOAL)

    const foodPromise = new Promise((resolve) => {
      // Handle food consumption and life counter
      for (const person of people) {
        if (civilizationCookedFood) {
          const eatFactor = person.eatFactor
          if (civilizationCookedFood.quantity >= eatFactor) {
            civilizationCookedFood.decrease(eatFactor)
            person.increaseLife(1)
            continue
          }
        }

        if (civilizationFood) {
          const eatFactor = person.eatFactor * 2
          if (civilizationFood.quantity >= eatFactor) {
            civilizationFood.decrease(eatFactor)
            person.increaseLife(0.5)
            continue
          }
        }

        person.decreaseLife(4)
      }
      resolve(null)
    })

    const heatPromise = new Promise((resolve) => {
      // Handle wood consumption

      if (civilizationWood || civilizationCharcoal) {
        let requiredWoodQuantity = 0

        switch (world.season) {
          case 'winter':
            requiredWoodQuantity = 3
            break
          case 'automn':
            requiredWoodQuantity = 2
            break
        }

        if (!requiredWoodQuantity) {
          resolve(null)
        }

        const peopleHeatedWithCharcoal = Math.min(
          civilizationCharcoal.quantity * PEOPLE_CHARCOAL_CAN_HEAT,
          people.length,
        )

        let peopleDoesNotHaveHeat = [...people]

        if (peopleHeatedWithCharcoal) {
          peopleDoesNotHaveHeat = people.toSpliced(0, peopleHeatedWithCharcoal)
          civilizationCharcoal.decrease(
            Math.ceil(
              (people.length - peopleDoesNotHaveHeat.length) /
              PEOPLE_CHARCOAL_CAN_HEAT,
            ),
          )
        }

        if (!peopleDoesNotHaveHeat.length) {
          return resolve(null)
        }

        for (const person of peopleDoesNotHaveHeat) {
          if (civilizationWood.quantity >= requiredWoodQuantity) {
            civilizationWood.decrease(requiredWoodQuantity)
          } else {
            person.decreaseLife()
          }
        }
      }
      resolve(null)
    })

    await Promise.all([foodPromise, heatPromise])
  }

  async passAMonth(world: World): Promise<void> {
    // Handle resource collection

    const gatherers = this.getPeopleWithOccupation(OccupationTypes.GATHERER)
    const woodCutters = this.getPeopleWithOccupation(OccupationTypes.WOODCUTTER)
    const children = this.getPeopleWithOccupation(OccupationTypes.CHILD)

    await Promise.all([
      this.collectResource(children, world),
      this.collectResource(gatherers, world),
      this.collectResource(woodCutters, world),
    ])

    const people = this.people
      .toSorted(
        (firstPerson, secondPerson) => secondPerson.years - firstPerson.years,
      )
      .toSorted((person) => (person.work?.canWork(person.years) ? 1 : -1))

    await this.resourceConsumption(world, people)

    // Age all people
    this._people.forEach((person) => person.ageOneMonth())

    this.checkHousing()
    this.removeDeadPeople()

    const activePeopleCount = this.people.filter(
      ({ work }) => work?.occupationType !== OccupationTypes.RETIRED,
    ).length

    // Allow only half people to be child
    const adults = this.getPeopleWithoutOccupation(OccupationTypes.CHILD)
    if (
      activePeopleCount < MAX_ACTIVE_PEOPLE_BY_CIVILIZATION &&
      children.length < (adults.length * 1) / 3
    ) {
      await this.createNewPeople()
    }

    await this.birthAwaitingBabies()

    this.extractResources()
    this.produceResources()

    this.adaptPeopleJob()
    this.buildNewBuilding()

    if (!this.nobodyAlive()) {
      this.livedMonths++
    }
  }

  private useProductionBuilding(building: ProductionBuilding) {
    for (let i = building.count; i > 0; i--) {
      const requiredWorkers = building.workerTypeRequired
      const workerByTypes = new Map<OccupationTypes, People[]>()
      const requiredResourceAmountIndexedByType = new Map<
        ResourceTypes,
        number
      >()

      const workerRequiredCount = requiredWorkers.reduce(
        (count, { count: amount }) => count + amount,
        0,
      )

      for (const requiredWorker of requiredWorkers) {
        const workers = this.getPeopleWithOccupation(
          requiredWorker.occupation,
        ).filter((people) => people.canWork())

        workerByTypes.set(
          requiredWorker.occupation,
          workers.splice(0, requiredWorker.count),
        )
      }

      for (const requiredResources of building.inputResources) {
        const resource = this.getResource(requiredResources.resource)

        if (resource.quantity < requiredResources.amount) {
          return
        }

        requiredResourceAmountIndexedByType.set(
          requiredResources.resource,
          requiredResources.amount,
        )
      }
      let availableWorkers = 0

      for (const workers of workerByTypes.values()) {
        for (const worker of workers) {
          worker.hasWork = true

          availableWorkers++
        }
      }
      const productionRatio = availableWorkers / workerRequiredCount
      for (const [
        resource,
        amount,
      ] of requiredResourceAmountIndexedByType.entries()) {
        this.decreaseResource(resource, amount)
      }

      for (const producedResource of building.outputResources) {
        this.increaseResource(
          producedResource.resource,
          Math.ceil(producedResource.amount * productionRatio),
        )
      }
    }
  }

  private extractResources() {
    if (this.mine) {
      this.extractResourcesFromBuilding(this.mine)
    }
  }

  private extractResourcesFromBuilding(building: ExtractionBuilding) {
    const resourcesProbabilities = building.outputResources
    const requiredWorkers = building.workerTypeRequired
    for (const requiredWorker of requiredWorkers) {
      const worker = this.getPeopleWithOccupation(
        requiredWorker.occupation,
      ).find((people) => people.canWork())

      if (!worker) {
        return
      }
      worker.hasWork = true
      for (const resource of resourcesProbabilities) {
        if (isWithinChance(resource.probability)) {
          const amount = getRandomInt(1, 100)
          this.increaseResource(resource.resource, amount)
          if (building.capacity) {
            building.capacity -= amount
          }

          if (!building?.capacity) {
            building.count = 0
          }
        }
      }
    }
  }

  private produceResources() {
    if (this.sawmill) {
      this.useProductionBuilding(this.sawmill)
    }

    if (this.kiln) {
      this.useProductionBuilding(this.kiln)
    }

    if (this.farm) {
      this.useProductionBuilding(this.farm)
    }

    if (this.campfire) {
      this.useProductionBuilding(this.campfire)
    }
  }

  private buildNewBuilding() {
    this.buildNewHouses()
    // TODO: create a new function to determine if building is full
    if (isWithinChance(CHANCE_TO_BUILD_EVOLVED_BUILDING)) {
      this.buildNew(
        BuildingTypes.KILN,
        Kiln.constructionCosts,
        Kiln.workerRequiredToBuild,
        Kiln.timeToBuild,
      )
    }

    if (isWithinChance(CHANCE_TO_BUILD_EVOLVED_BUILDING)) {
      this.buildNew(
        BuildingTypes.SAWMILL,
        Sawmill.constructionCosts,
        Sawmill.workerRequiredToBuild,
        Sawmill.timeToBuild,
      )
    }

    if (isWithinChance(CHANCE_TO_BUILD_EVOLVED_BUILDING)) {
      this.buildNew(
        BuildingTypes.FARM,
        Farm.constructionCosts,
        Farm.workerRequiredToBuild,
        Farm.timeToBuild,
      )
    }

    if (isWithinChance(CHANCE_TO_BUILD_EVOLVED_BUILDING)) {
      this.buildNew(
        BuildingTypes.CAMPFIRE,
        Campfire.constructionCosts,
        Campfire.workerRequiredToBuild,
        Campfire.timeToBuild,
      )
    }

    if (isWithinChance(CHANCE_TO_BUILD_EVOLVED_BUILDING)) {
      if (!this.mine?.count) {
        this.buildNew(
          BuildingTypes.MINE,
          Mine.constructionCosts,
          Mine.workerRequiredToBuild,
          Mine.timeToBuild,
        )
      }
    }
  }

  private buildNewHouses() {
    const canBuild = House.constructionCosts.every(
      (cost) => this.getResource(cost.resource).quantity >= cost.amount,
    )
    if (!canBuild) {
      return
    }

    const housesTotalCapacity = House.capacity * (this.houses?.count ?? 0)
    const workerNeeded = Math.ceil(
      (this._people.length - housesTotalCapacity) / House.capacity,
    )

    if (workerNeeded < 0) {
      return
    }
    const filteredWorkers = this.people.filter((citizen) => citizen.canWork())
    const workers = filteredWorkers.slice(
      0,
      Math.min(workerNeeded, filteredWorkers.length),
    )

    for (const worker of workers) {
      const canContinueBuilding = House.constructionCosts.every(
        (cost) => this.getResource(cost.resource).quantity >= cost.amount,
      )

      if (!canContinueBuilding) {
        return
      }

      for (const cost of House.constructionCosts) {
        this.decreaseResource(cost.resource, cost.amount)
      }

      worker.startBuilding()
      this.constructBuilding(BuildingTypes.HOUSE)
    }
  }

  private buildNew(
    buildingType: BuildingTypes,
    constructionCosts: ConstructionCost[],
    workerRequiredToBuild: WorkerRequiredToBuild[],
    timeToBuild: number,
  ) {
    const canBuild =
      constructionCosts.every(
        (cost) => this.getResource(cost.resource).quantity >= cost.amount,
      ) || !constructionCosts.length
    if (!canBuild) {
      return
    }

    const workers = workerRequiredToBuild.reduce<People[]>(
      (workers, workerRequired) => {
        const availableWorkers = this.getPeopleWithOccupation(
          workerRequired.occupation,
        )
        for (let i = 0; i < workerRequired.amount; i++) {
          const worker = availableWorkers.find(
            (citizen) =>
              citizen.canWork() && !workers.find(({ id }) => id === citizen.id),
          )
          if (worker) {
            workers.push(worker)
          }
        }
        return workers
      },
      [],
    )

    if (
      workers.length <
      workerRequiredToBuild.reduce((sum, { amount }) => sum + amount, 0)
    ) {
      return
    }
    for (const worker of workers) {
      worker.startBuilding(timeToBuild)
    }

    for (const cost of constructionCosts) {
      this.decreaseResource(cost.resource, cost.amount)
    }

    this.constructBuilding(buildingType)
  }

  private checkHousing() {
    let lastCitizenWithoutHouseIndex = 0
    if (this.houses) {
      lastCitizenWithoutHouseIndex = House.capacity * this.houses.count - 1
    }
    const citizenWithoutHouse = this.people.slice(lastCitizenWithoutHouseIndex)

    for (const citizen of citizenWithoutHouse) {
      citizen.decreaseLife()
    }
  }

  public adaptPeopleJob() {
    const workers = this.getWorkersWhoCanRetire()
    for (const citizen of workers) {
      citizen.setOccupation(OccupationTypes.RETIRED)
    }

    const workersCanUpgrade = this.getWorkersWhoCanUpgrade()
    for (const worker of workersCanUpgrade) {
      const hasChanceToEvolve =
        worker.work?.occupationType === OccupationTypes.CHILD ||
        isWithinChance(CHANCE_TO_EVOLVE)
      if (hasChanceToEvolve && worker.work && worker.canUpgradeWork()) {
        const newPossibleOccupations =
          OCCUPATION_TREE[worker.work.occupationType] ?? []

        if (!newPossibleOccupations.length) {
          continue
        }

        const selectedNewOccupation = getRandomInt(
          0,
          newPossibleOccupations.length - 1,
        )
        const newOccupation = newPossibleOccupations[selectedNewOccupation]
        console.log(newOccupation)

        if (newOccupation && this.getWorkerSpaceLeft(newOccupation) > 0) {
          worker.setOccupation(newOccupation)
        }
      }
    }
  }

  private async createNewPeople() {
    // Handle pregnancy

    let eligiblePeople: [People, People][] = []
    const ableToConceivePeople = this._people.filter((person) =>
      person.canConceive(),
    )

    const women = ableToConceivePeople.filter(
      ({ gender }) => gender === Gender.FEMALE,
    )
    const men = ableToConceivePeople
      .filter(({ gender }) => gender === Gender.MALE)
      .toSorted(() => Math.random() - 0.5)

    if (!women.length) {
      return
    }
    for (const woman of women) {
      const womanLineage = woman.getDirectLineage()
      const eligibleManIndex = men.findIndex((man) => {
        const manLineage = man.getDirectLineage()
        const manAndWomanIntersection = hasElementInCommon(
          womanLineage,
          manLineage,
        )

        return !manAndWomanIntersection
      })

      if (eligibleManIndex === -1) {
        continue
      }
      const [eligibleMan] = men.splice(eligibleManIndex, 1)

      if (eligibleMan) {
        eligiblePeople.push([woman, eligibleMan])
      }
    }

    if (!eligiblePeople.length) {
      return
    }

    await Promise.all(
      eligiblePeople.map(
        ([mother, father]) =>
          new Promise((resolve) => {
            if (!isWithinChance(PREGNANCY_PROBABILITY)) {
              return resolve(null)
            }

            const genders = [Gender.FEMALE, Gender.MALE]
            const newPerson = new People({
              month: 0,
              gender:
                genders[
                Math.min(
                  Math.floor(Math.random() * genders.length),
                  genders.length - 1,
                )
                ],
              lifeCounter: 2,
              lineage: {
                mother: {
                  id: mother.id,
                  ...(mother.lineage && {
                    lineage: {
                      mother: { id: mother.lineage.mother.id },
                      father: { id: mother.lineage.father.id },
                    },
                  }),
                },
                father: {
                  id: father.id,
                  ...(father.lineage && {
                    lineage: {
                      mother: { id: father.lineage.mother.id },
                      father: { id: father.lineage.father.id },
                    },
                  }),
                },
              },
            })
            newPerson.setOccupation(OccupationTypes.CHILD)

            mother.addChildToBirth(newPerson)

            mother.lifeCounter = Math.floor(mother.lifeCounter / 2)
            father.lifeCounter = Math.floor(father.lifeCounter / 2)
            resolve(null)
          }),
      ),
    )
  }

  private async birthAwaitingBabies() {
    const awaitingMothers = this._people.filter<People & { child: People }>(
      (person): person is People & { child: People } =>
        !!(person.pregnancyMonthsLeft === 0 && person.child),
    )

    await Promise.all(
      awaitingMothers.map(
        (mother) =>
          new Promise((resolve) => {
            this.addPeople(mother.child)
            mother.giveBirth()
            resolve(null)
          }),
      ),
    )
  }

  private removeDeadPeople() {
    this._people = this._people.filter((person) => person.isAlive())
  }
}
