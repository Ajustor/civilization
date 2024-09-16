import { Resource, ResourceTypes } from './resource'
import { countries, names, uniqueNamesGenerator } from 'unique-names-generator'

import type { Building } from './types/building'
import { BuildingTypes } from './buildings/enum'
import { Citizen } from './citizen/citizen'
import { Farmer } from './citizen/work/farmer'
import { Gender } from './citizen/enum'
import { House } from './buildings/house'
import { OccupationTypes } from './citizen/work/enum'
import type { World } from './world'
import { isWithinChance } from './utils'

const PREGNANCY_PROBABILITY = 60
const FARMER_RESOURCES_GET = 10

export class Civilization {
    public id!: string
    name = uniqueNamesGenerator({ dictionaries: [countries] })
    private _citizens: Citizen[]
    private _resources: Resource[]
    private _livedMonths: number = 0
    private _buildings: Building[]

    constructor() {
        this._citizens = []
        this._resources = []
        this._buildings = []
    }

    nobodyAlive(): boolean {
        return this._citizens.length === 0
    }

    get livedMonths(): number {
        return this._livedMonths
    }

    set livedMonths(livedMonths: number) {
        this._livedMonths = livedMonths
    }

    get citizens(): Citizen[] {
        return this._citizens
    }

    set citizens(citizens: Citizen[]) {
        this._citizens = citizens
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
        return this.buildings.find<House>((building): building is House => building.getType() === BuildingTypes.HOUSE)
    }

    set houses(house: House) {
        this.buildings.push(house)
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

    getCitizenWithOccupation(occupation: OccupationTypes): Citizen[] {
        return this._citizens.filter(({ work: citizenJob }) => citizenJob && occupation === citizenJob.occupationType)
    }

    addCitizen(...citizens: Citizen[]): void {
        this._citizens.push(...citizens)
    }

    addResource(...resources: Resource[]): void {
        this._resources.push(...resources)
    }

    addBuilding(...buildings: Building[]): void {
        this._buildings.push(...buildings)
    }

    constructBuilding(type: BuildingTypes, capacity: number): void {
        const woodResource = this._resources.find(res => res.type === ResourceTypes.WOOD)
        if (woodResource && woodResource.quantity >= 15 && type === BuildingTypes.HOUSE) {
            woodResource.decrease(15)
            this.houses ??= new House(capacity)
            this.houses.count++
        }
    }

    passAMonth(world: World): void {
        // Handle resource collection
        const foodResource = world.getResource(ResourceTypes.FOOD)
        const woodResource = world.getResource(ResourceTypes.WOOD)

        const civilizationFood = this.getResource(ResourceTypes.FOOD)
        const civilizationWood = this.getResource(ResourceTypes.WOOD)

        const farmers = this.getCitizenWithOccupation(OccupationTypes.FARMER)
        const carpentersCitizens = this.getCitizenWithOccupation(OccupationTypes.CARPENTER)

        if (foodResource?.quantity) {

            farmerLoop: for (const farmer of farmers) {
                const successfullyCollectResource = farmer.collectResource(world, FARMER_RESOURCES_GET)
                if (!successfullyCollectResource) {
                    break farmerLoop
                }
                civilizationFood.increase(FARMER_RESOURCES_GET)
            }
        }

        if (woodResource?.quantity) {
            carpentersLoop: for (const carpenter of carpentersCitizens) {
                if (!carpenter.isBuilding) {
                    const successfullyCollectResource = carpenter.collectResource(world, 1)
                    if (!successfullyCollectResource) {
                        break carpentersLoop
                    }
                    civilizationWood.increase(1)
                }
            }
        }

        const citizens = this.citizens.toSorted((firstCitizen, secondCitizen) => secondCitizen.years - firstCitizen.years).toSorted((citizen) => citizen.work?.canWork(citizen.years) ? 1 : -1)

        // Handle food consumption and life counter
        if (civilizationFood) {
            for (const citizen of citizens) {
                const eatFactor = citizen.eatFactor
                if (civilizationFood.quantity >= eatFactor && citizen.lifeCounter < 50) {
                    citizen.increaseLife(1)
                    civilizationFood.decrease(eatFactor)
                } else {
                    citizen.decreaseLife()
                }
            }
        }

        // Handle wood consumption
        woodConsumptionLoop: if (civilizationWood) {
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
                break woodConsumptionLoop
            }

            for (const citizen of citizens) {
                if (civilizationWood.quantity >= requiredWoodQuantity) {
                    civilizationWood.decrease(requiredWoodQuantity)
                } else {
                    citizen.decreaseLife()
                }
            }
        }

        // Age all citizens
        this._citizens.forEach(citizen => citizen.ageOneMonth())
        this.removeDeadCitizens()
        this.createNewCitizen()
        this.birthAwaitingBabies()
        this.buildNewHouses()
        this.checkHabitations()

        if (!this.nobodyAlive()) {
            this.livedMonths++
        }
    }

    private buildNewHouses() {
        const civilizationWood = this.getResource(ResourceTypes.WOOD)

        const housesTotalCapacity = (this.houses?.capacity ?? 0) * (this.houses?.count ?? 0)

        if (this._citizens.length > housesTotalCapacity && civilizationWood.quantity >= 15) {
            const carpenter = this.getCitizenWithOccupation(OccupationTypes.CARPENTER).find(citizen => citizen.work?.canWork(citizen.years) && !citizen.isBuilding)
            if (carpenter) {
                carpenter.startBuilding()
                this.constructBuilding(BuildingTypes.HOUSE, 4)
            }
        }
    }

    private checkHabitations() {
        let lastCitizenWithoutHouseIndex = 0
        if (this.houses) {
            lastCitizenWithoutHouseIndex = this.houses.capacity * this.houses.count - 1
        }
        const citizenWithoutHouse = this.citizens.slice(lastCitizenWithoutHouseIndex, undefined)

        for (const citizen of citizenWithoutHouse) {
            citizen.decreaseLife()
        }
    }

    public adaptCitizen() {
        const farmerCount = this.getCitizenWithOccupation(OccupationTypes.FARMER).length
        const oldCarpenters = this.getCitizenWithOccupation(OccupationTypes.CARPENTER)

        if (farmerCount < oldCarpenters.length) {
            for (let i = 0; i > oldCarpenters.length / 2; i++) {
                oldCarpenters[i].setOccupation(OccupationTypes.FARMER)
                oldCarpenters[i].work = new Farmer()
            }
        }
    }

    private createNewCitizen() {
        // Handle pregnancy

        let eligibleCitizens: [Citizen, Citizen][] = []
        const citizenCanReproduce = this._citizens.filter(citizen => citizen.canReproduce())

        const women = citizenCanReproduce.filter(({ gender }) => gender === Gender.FEMALE)
        const men = citizenCanReproduce.filter(({ gender }) => gender === Gender.MALE)

        const smallestSize = Math.min(women.length, men.length)

        for (let i = 0; i < smallestSize; i++) {
            eligibleCitizens.push([women[i], men[i]])
        }

        if (eligibleCitizens.length) {
            for (const [mother, father] of eligibleCitizens) {

                if (!isWithinChance(PREGNANCY_PROBABILITY)) {
                    continue
                }

                const occupations = [OccupationTypes.CARPENTER, OccupationTypes.FARMER, mother.work?.occupationType ?? OccupationTypes.CARPENTER, father.work?.occupationType ?? OccupationTypes.FARMER]
                const genders = [Gender.FEMALE, Gender.MALE]
                const newCitizen = new Citizen(
                    uniqueNamesGenerator({ dictionaries: [names] }),
                    0,
                    genders[Math.floor(Math.random() * genders.length)],
                    2
                )
                newCitizen.setOccupation(occupations[Math.floor(Math.random() * occupations.length)])

                mother.addChildToBirth(newCitizen)

                mother.lifeCounter = Math.floor(mother.lifeCounter / 2)
                father.lifeCounter = Math.floor(father.lifeCounter / 2)
            }
        }
    }

    private birthAwaitingBabies() {
        const awaitingMothers = this._citizens.filter(({ pregnancyMonthsLeft, child }) => pregnancyMonthsLeft === 0 && child)

        for (const mother of awaitingMothers) {
            if (!mother.child) {
                continue
            }

            this.addCitizen(mother.child)
            mother.giveBirth()
        }
    }

    private removeDeadCitizens() {
        this._citizens = this._citizens.filter(citizen => citizen.isAlive())
    }
}
