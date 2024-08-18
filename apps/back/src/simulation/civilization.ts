import { Citizen } from './citizen/citizen'
import { Resource, ResourceType } from './resource'
import { House } from './buildings/house'
import type { World } from './world'
import { names, uniqueNamesGenerator, countries } from 'unique-names-generator'
import chalk from 'chalk'
import { range } from '../utils'
import { ProfessionType } from './citizen/work/enum'
import { Farmer } from './citizen/work/farmer'
import { BuildingTypes } from './buildings/enum'

export class Civilization {
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

    getCivilizationInfos(): string {
        return `
${chalk.blue(`--- ${this.name} Status ---`)}
${chalk.green(`citizens:
${this.citizens.map((citizen) => `${citizen.name}, ${citizen.age} years old, ${citizen.profession?.professionType} (${citizen.lifeCounter} life points)`).join(' || ')}`)}
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

    getCitizenWithProfession(profession: ProfessionType): Citizen[] {
        return this.citizens.filter(({ profession: citizenProfession }) => citizenProfession && profession === citizenProfession.professionType)
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

        const farmers = this.getCitizenWithProfession(ProfessionType.FARMER)
        const carpenters = this.getCitizenWithProfession(ProfessionType.CARPENTER)

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
            carpentersLoop: for (const carpenter of carpenters) {
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

            for (const farmer of farmers.sort((firstCitizen, secondCitizen) => firstCitizen.age - secondCitizen.age)) {
                if (civilizationFood.getQuantity() >= 1) {
                    civilizationFood.decrease(1)
                    farmer.increaseLife(1)
                } else {
                    farmer.decreaseLife()
                }
            }

            for (const carpenter of carpenters.sort((firstCitizen, secondCitizen) => firstCitizen.age - secondCitizen.age)) {
                if (civilizationFood.getQuantity() >= 2) {
                    civilizationFood.decrease(2)
                    carpenter.increaseLife(1)
                } else {
                    carpenter.decreaseLife()
                }
            }
        }


        // Age all citizens
        this.citizens.forEach(citizen => citizen.ageOneYear())
        this.removeDeadCitizens()
        this.birthNewCitizen()

        if (this.citizens.length > this.houses.reduce((acc, building) => acc + building.capacity, 0) && civilizationWood.getQuantity() >= 15) {
            const carpenter = this.getCitizenWithProfession(ProfessionType.CARPENTER).find(citizen => !citizen.isBuilding)
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
        const farmerCount = this.getCitizenWithProfession(ProfessionType.FARMER).length
        const carpenterCount = this.getCitizenWithProfession(ProfessionType.CARPENTER).length

        if (farmerCount < carpenterCount) {
            const oldCarpenters = this.getCitizenWithProfession(ProfessionType.CARPENTER)
            for (let i = 0; i > oldCarpenters.length / 2; i++) {
                oldCarpenters[i].setProfession(ProfessionType.FARMER)
                oldCarpenters[i].profession = new Farmer()
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
                const professions = [ProfessionType.CARPENTER, ProfessionType.FARMER, parent1.profession?.professionType ?? ProfessionType.CARPENTER, parent2.profession?.professionType ?? ProfessionType.FARMER]
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
