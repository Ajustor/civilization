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

export class Civilization {
    public id!: string
    name = uniqueNamesGenerator({ dictionaries: [countries] })
    private _citizens: Citizen[]
    private _resources: Resource[]
    private _livedMonths: number = 0
    private houses: House[]

    constructor() {
        this._citizens = []
        this._resources = []
        this.houses = []
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
        return [...this.houses]

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

    addBuilding(...buildings: House[]): void {
        this.houses.push(...buildings)
    }

    constructBuilding(type: BuildingTypes, capacity: number): void {
        const woodResource = this._resources.find(res => res.type === ResourceTypes.WOOD)
        if (woodResource && woodResource.quantity >= 15 && type === BuildingTypes.HOUSE) {
            woodResource.decrease(15)
            this.addBuilding(new House(capacity))
        } else {
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

            const farmerGetResources = 4

            farmerLoop: for (const farmer of farmers) {
                const successfullyCollectResource = farmer.collectResource(world, farmerGetResources)
                if (!successfullyCollectResource) {
                    break farmerLoop
                }
                civilizationFood.increase(farmerGetResources)
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

        // Handle food consumption and life counter
        if (civilizationFood) {

            for (const farmer of farmers.sort((firstCitizen, secondCitizen) => firstCitizen.years - secondCitizen.years)) {
                if (civilizationFood.quantity >= 1 && farmer.lifeCounter < 50) {
                    civilizationFood.decrease(1)
                    farmer.increaseLife(1)
                } else {
                    farmer.decreaseLife()
                }
            }

            for (const carpenter of carpentersCitizens.sort((firstCitizen, secondCitizen) => firstCitizen.years - secondCitizen.years)) {
                if (civilizationFood.quantity >= 2 && carpenter.lifeCounter < 50) {
                    civilizationFood.decrease(2)
                    carpenter.increaseLife(1)
                } else {
                    carpenter.decreaseLife()
                }
            }
        }

        // Age all citizens
        this._citizens.forEach(citizen => citizen.ageOneMonth())
        this.removeDeadCitizens()
        this.createNewCitizen()
        this.birthWaitingChildren()

        if (this._citizens.length > this.houses.reduce((acc, building) => acc + building.capacity, 0) && civilizationWood.quantity >= 15) {
            const carpenter = this.getCitizenWithOccupation(OccupationTypes.CARPENTER).find(citizen => !citizen.isBuilding)
            if (carpenter) {
                carpenter.startBuilding()
                this.constructBuilding(BuildingTypes.HOUSE, 4)
            }
        }

        for (const citizen of this._citizens) {
            const hasAHouse = this.houses.some(({ residents }) => residents.findIndex((cit) => cit === citizen) !== -1)
            if (!hasAHouse) {
                const availableBuilding = this.houses.find(({ residents, capacity }) => residents.length < capacity)
                if (availableBuilding) {
                    availableBuilding.addResident(citizen)
                } else {
                    citizen.decreaseLife()
                }
            }
        }

        if (!this.nobodyAlive()) {
            this.livedMonths++
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
        // Handle births

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

    private birthWaitingChildren() {
        const awaitingMothers = this._citizens.filter(({ pregnancyMonthsLeft, child }) => pregnancyMonthsLeft === 0 && child)

        for (const mother of awaitingMothers) {
            if (!mother.child) {
                continue
            }

            this.addCitizen(mother.child)

            const availableBuilding = this.houses.find(({ capacity }) => capacity < 4)
            if (availableBuilding) {
                availableBuilding.addResident(mother.child)
            }

            mother.giveBirth()
        }
    }

    private removeDeadCitizens() {
        const deadCitizens = this._citizens.filter(citizen => !citizen.isAlive())
        this._citizens = this._citizens.filter(citizen => citizen.isAlive())

        for (const deadCitizen of deadCitizens) {
            this.houses = this.houses.reduce((buildings, { residents }) => {
                const deadResidentIndex = residents.findIndex((cit) => cit === deadCitizen)
                if (deadResidentIndex !== -1) {
                    residents.splice(deadResidentIndex, 1)
                }
                return buildings
            }, this.houses)
        }
    }
}
