import { Resource, ResourceType } from './resource'
import { countries, names, uniqueNamesGenerator } from 'unique-names-generator'

import { Building } from './buildings/buildings.type'
import { BuildingTypes } from './buildings/enum'
import { Citizen } from './citizen/citizen'
import { Farmer } from './citizen/work/farmer'
import { Gender } from './citizen/enum'
import { House } from './buildings/house'
import { OccupationType } from './citizen/work/enum'
import type { World } from './world'
import chalk from 'chalk'
import { range } from '../utils'

export class Civilization {
    public id!: string
    name = uniqueNamesGenerator({ dictionaries: [countries] })
    private citizens: Citizen[]
    private resources: Resource[]
    private houses: House[]

    constructor() {
        this.citizens = []
        this.resources = []
        this.houses = []
    }

    nobodyAlive(): boolean {
        return this.citizens.length === 0
    }

    getCitizens(): Citizen[] {
        return this.citizens
    }

    getResources(): Resource[] {
        return this.resources
    }

    getBuildings(): Building[] {
        return [...this.houses]
    }

    getCivilizationInfos(): string {
        return `
${chalk.blue(`--- ${this.name} Status ---`)}
${chalk.green(`citizens:
${this.citizens.map((citizen) => `${citizen.name}, ${citizen.years} years old, ${citizen.work?.occupationType} (${citizen.lifeCounter} life points)`).join(' || ')}`)}
${chalk.green(`buildings:
${this.houses.map((house) => `Houses: ${house.residents.length}/${house.capacity}`).join(' || ')}`)}
${chalk.yellow(`resources:
${this.resources.map((resource) => `- ${resource.getType()}: ${resource.getQuantity()}`).join('\n')}`)}
${chalk.blue('---------------------------')}`
    }

    increaseResource(type: ResourceType, count: number) {
        const resource = this.resources.find((resource) => type === resource.getType())

        if (!resource) {
            this.resources.push(new Resource(type, count))
        } else {
            resource.increase(count)
        }
    }

    decreaseResource(type: ResourceType, count: number) {
        const resource = this.resources.find((resource) => type === resource.getType())

        if (!resource) {
            this.resources.push(new Resource(type, 0))
        } else {
            resource.decrease(count)
        }
    }

    getResource(type: ResourceType): Resource {
        let resource = this.resources.find((resource) => resource.getType() === type)

        if (!resource) {
            resource = new Resource(type, 0)
            this.addResource(resource)
        }

        return resource
    }

    getCitizenWithOccupation(occupation: OccupationType): Citizen[] {
        return this.citizens.filter(({ work: citizenOccupation }) => citizenOccupation && occupation === citizenOccupation.occupationType)
    }

    addCitizen(...citizens: Citizen[]): void {
        this.citizens.push(...citizens)
    }

    addResource(...resources: Resource[]): void {
        this.resources.push(...resources)
    }

    addBuilding(...buildings: House[]): void {
        this.houses.push(...buildings)
    }

    constructBuilding(type: BuildingTypes, capacity: number): void {
        const woodResource = this.resources.find(res => res.getType() === ResourceType.WOOD)
        if (woodResource && woodResource.getQuantity() >= 15 && type === BuildingTypes.HOUSE) {
            woodResource.decrease(15)
            this.addBuilding(new House(capacity))
        } else {
        }
    }

    passAMonth(world: World): void {
        // Handle resource collection
        const foodResource = world.getResource(ResourceType.FOOD)
        const woodResource = world.getResource(ResourceType.WOOD)

        const civilizationFood = this.getResource(ResourceType.FOOD)
        const civilizationWood = this.getResource(ResourceType.WOOD)

        const farmers = this.getCitizenWithOccupation(OccupationType.FARMER)
        const carpentersCitizens = this.getCitizenWithOccupation(OccupationType.CARPENTER)

        if (foodResource?.getQuantity()) {

            const farmerGetResources = 4

            farmerLoop: for (const farmer of farmers) {
                const successfullyCollectResource = farmer.collectResource(world, farmerGetResources)
                if (!successfullyCollectResource) {
                    break farmerLoop
                }
                civilizationFood.increase(farmerGetResources)
            }
        }

        if (woodResource?.getQuantity()) {
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
                if (civilizationFood.getQuantity() >= 1 && farmer.lifeCounter < 50) {
                    civilizationFood.decrease(1)
                    farmer.increaseLife(1)
                } else {
                    farmer.decreaseLife()
                }
            }

            for (const carpenter of carpentersCitizens.sort((firstCitizen, secondCitizen) => firstCitizen.years - secondCitizen.years)) {
                if (civilizationFood.getQuantity() >= 2 && carpenter.lifeCounter < 50) {
                    civilizationFood.decrease(2)
                    carpenter.increaseLife(1)
                } else {
                    carpenter.decreaseLife()
                }
            }
        }

        // Age all citizens
        this.citizens.forEach(citizen => citizen.ageOneMonth())
        this.removeDeadCitizens()
        this.birthNewCitizen()

        if (this.citizens.length > this.houses.reduce((acc, building) => acc + building.capacity, 0) && civilizationWood.getQuantity() >= 15) {
            const carpenter = this.getCitizenWithOccupation(OccupationType.CARPENTER).find(citizen => !citizen.isBuilding)
            if (carpenter) {
                carpenter.startBuilding()
                this.constructBuilding(BuildingTypes.HOUSE, 4)
            }
        }

        for (const citizen of this.citizens) {
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
    }

    public adaptCitizen() {
        const farmerCount = this.getCitizenWithOccupation(OccupationType.FARMER).length
        const carpenterCount = this.getCitizenWithOccupation(OccupationType.CARPENTER).length

        if (farmerCount < carpenterCount) {
            const oldCarpenters = this.getCitizenWithOccupation(OccupationType.CARPENTER)
            for (let i = 0; i > oldCarpenters.length / 2; i++) {
                oldCarpenters[i].setOccupation(OccupationType.FARMER)
                oldCarpenters[i].work = new Farmer()
            }
        }
    }

    private birthNewCitizen() {
        // Handle births

        let eligibleCitizens: [Citizen, Citizen][] = []
        const citizenCanReproduce = this.citizens.filter(citizen => citizen.canReproduce())

        for (const i of range(0, citizenCanReproduce.length, 2)) {
            if (citizenCanReproduce[i + 1]) {
                eligibleCitizens.push([citizenCanReproduce[i], citizenCanReproduce[i + 1]])
            }
        }

        if (eligibleCitizens.length) {
            for (const [parent1, parent2] of eligibleCitizens) {
                const occupations = [OccupationType.CARPENTER, OccupationType.FARMER, parent1.work?.occupationType ?? OccupationType.CARPENTER, parent2.work?.occupationType ?? OccupationType.FARMER]
                const genders = [Gender.FEMALE, Gender.MALE]
                const newCitizen = new Citizen(
                    uniqueNamesGenerator({ dictionaries: [names] }),
                    0,
                    genders[Math.floor(Math.random() * genders.length )],
                    2)
                newCitizen.setOccupation(occupations[Math.floor(Math.random() * occupations.length)])
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
        const deadCitizens = this.citizens.filter(citizen => !citizen.isAlive())
        this.citizens = this.citizens.filter(citizen => citizen.isAlive())

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
