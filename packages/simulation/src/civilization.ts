import { Citizen } from './citizen/citizen'
import { Resource, ResourceTypes } from './resource'
import { House } from './buildings/house'
import type { World } from './world'
import { names, uniqueNamesGenerator, countries } from 'unique-names-generator'
import { range } from './utils'
import { ProfessionTypes } from './citizen/work/enum'
import { Farmer } from './citizen/work/farmer'
import { BuildingTypes } from './buildings/enum'
import type { Building } from './types/building'

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

    getCitizenWithProfession(profession: ProfessionTypes): Citizen[] {
        return this._citizens.filter(({ profession: citizenProfession }) => citizenProfession && profession === citizenProfession.professionType)
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

        const farmers = this.getCitizenWithProfession(ProfessionTypes.FARMER)
        const carpentersCitizens = this.getCitizenWithProfession(ProfessionTypes.CARPENTER)

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
        this.birthNewCitizen()

        if (this._citizens.length > this.houses.reduce((acc, building) => acc + building.capacity, 0) && civilizationWood.quantity >= 15) {
            const carpenter = this.getCitizenWithProfession(ProfessionTypes.CARPENTER).find(citizen => !citizen.isBuilding)
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
        const farmerCount = this.getCitizenWithProfession(ProfessionTypes.FARMER).length
        const oldCarpenters = this.getCitizenWithProfession(ProfessionTypes.CARPENTER)

        if (farmerCount < oldCarpenters.length) {
            for (let i = 0; i > oldCarpenters.length / 2; i++) {
                oldCarpenters[i].setProfession(ProfessionTypes.FARMER)
                oldCarpenters[i].profession = new Farmer()
            }
        }
    }

    private birthNewCitizen() {
        // Handle births

        let eligibleCitizens: [Citizen, Citizen][] = []
        const citizenCanReproduce = this._citizens.filter(citizen => citizen.canReproduce())

        for (const i of range(0, citizenCanReproduce.length, 2)) {
            if (citizenCanReproduce[i + 1]) {
                eligibleCitizens.push([citizenCanReproduce[i], citizenCanReproduce[i + 1]])
            }
        }

        if (eligibleCitizens.length) {
            for (const [parent1, parent2] of eligibleCitizens) {
                const professions = [ProfessionTypes.CARPENTER, ProfessionTypes.FARMER, parent1.profession?.professionType ?? ProfessionTypes.CARPENTER, parent2.profession?.professionType ?? ProfessionTypes.FARMER]
                const newCitizen = new Citizen(uniqueNamesGenerator({ dictionaries: [names] }), 0, 2)
                newCitizen.setProfession(professions[Math.floor(Math.random() * professions.length)])
                this.addCitizen(newCitizen)

                const availableBuilding = this.houses.find(({ capacity }) => capacity < 4)
                if (availableBuilding) {
                    availableBuilding.addResident(newCitizen)
                }

                parent1.lifeCounter = Math.floor(parent1.lifeCounter / 2)
                parent2.lifeCounter = Math.floor(parent2.lifeCounter / 2)
            }
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
