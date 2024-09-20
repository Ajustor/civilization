import { Resource, ResourceTypes } from './resource'
import { countries, names, uniqueNamesGenerator } from 'unique-names-generator'

import type { Building } from './types/building'
import { BuildingTypes } from './buildings/enum'
import { Farmer } from './people/work/farmer'
import { Gender } from './people/enum'
import { House } from './buildings/house'
import { OccupationTypes } from './people/work/enum'
import { People } from './people/people'
import type { World } from './world'
import { isWithinChance } from './utils'

const PREGNANCY_PROBABILITY = 60
const FARMER_RESOURCES_GET = 10
const CARPENTER_RESOURCES_GET = 20

export class Civilization {
    public id!: string
    public name = uniqueNamesGenerator({ dictionaries: [countries] })
    private _people: People[]
    private _resources: Resource[]
    private _livedMonths: number = 0
    private _buildings: Building[]

    constructor() {
        this._people = []
        this._resources = []
        this._buildings = []
    }

    nobodyAlive(): boolean {
        return this._people.length === 0
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

    getPeopleWithOccupation(occupation: OccupationTypes): People[] {
        return this._people.filter(({ work: peopleJob }) => peopleJob && occupation === peopleJob.occupationType)
    }

    addPeople(...people: People[]): void {
        this._people.push(...people)
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

        const farmers = this.getPeopleWithOccupation(OccupationTypes.FARMER)
        const carpenters = this.getPeopleWithOccupation(OccupationTypes.CARPENTER)

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
            carpentersLoop: for (const carpenter of carpenters) {
                if (!carpenter.isBuilding) {
                    const successfullyCollectResource = carpenter.collectResource(world, CARPENTER_RESOURCES_GET)
                    if (!successfullyCollectResource) {
                        break carpentersLoop
                    }
                    civilizationWood.increase(CARPENTER_RESOURCES_GET)
                }
            }
        }

        const people = this.people.toSorted((firstPerson, secondPerson) => secondPerson.years - firstPerson.years).toSorted((person) => person.work?.canWork(person.years) ? 1 : -1)

        // Handle food consumption and life counter
        if (civilizationFood) {

            for (const person of people) {
                const eatFactor = person.eatFactor
                if (civilizationFood.quantity >= eatFactor) {
                    if (person.lifeCounter < 50) {
                        person.increaseLife(1)
                    }
                    civilizationFood.decrease(eatFactor)
                } else {
                    person.decreaseLife()
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

            for (const person of people) {
                if (civilizationWood.quantity >= requiredWoodQuantity) {
                    civilizationWood.decrease(requiredWoodQuantity)
                } else {
                    person.decreaseLife()
                }
            }
        }

        // Age all people
        this._people.forEach(person => person.ageOneMonth())
        this.removeDeadPeople()
        this.createNewPeople()
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

        if (this._people.length > housesTotalCapacity && civilizationWood.quantity >= 15) {
            const carpenter = this.getPeopleWithOccupation(OccupationTypes.CARPENTER).find(citizen => citizen.work?.canWork(citizen.years) && !citizen.isBuilding)
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
        const citizenWithoutHouse = this.people.slice(lastCitizenWithoutHouseIndex, undefined)

        for (const citizen of citizenWithoutHouse) {
            citizen.decreaseLife()
        }
    }


    public adaptPeopleJob() {
        const farmerCount = this.getPeopleWithOccupation(OccupationTypes.FARMER).length
        const oldCarpenters = this.getPeopleWithOccupation(OccupationTypes.CARPENTER)

        if (farmerCount < oldCarpenters.length) {
            for (let i = 0; i > oldCarpenters.length / 2; i++) {
                oldCarpenters[i].setOccupation(OccupationTypes.FARMER)
                oldCarpenters[i].work = new Farmer()
            }
        }
    }

    private createNewPeople() {
        // Handle pregnancy

        let eligiblePeople: [People, People][] = []
        const ableToConceivePeople = this._people.filter(person => person.canConceive())

        ableToConceivePeople.forEach((person) => person.buildLineageTree())

        const women = ableToConceivePeople.filter(({ gender }) => gender === Gender.FEMALE)
        let men = ableToConceivePeople.filter(({ gender }) => gender === Gender.MALE)

        for (const woman of women) {

            // A person SHOULD NOT be in a relationship with a direct ancestor
            let eligibleMen = men.filter(({ id }) => !woman.tree || !woman.tree.findByKey(id))

            // A person SHOULD NOT be in a relationship with a child of his/her parent
            if (woman.lineage) {
                eligibleMen = eligibleMen.filter(({ tree }) => !tree || (!tree.findByKeyAndLevel(woman.lineage!.father.id, 1) && !tree.findByKeyAndLevel(woman.lineage!.mother.id, 1)))
            }

            // A person SHOULD NOT be in a relationship with a descendant of his/her grand-parent
            if (woman.lineage) {
                const grandParent = woman.tree?.filterAllByLevel(2).map(({ nodeKey }) => nodeKey) ?? []
                if (grandParent.length) {
                    eligibleMen = eligibleMen.filter(({ tree }) => !tree || (!tree.findByKeyAndMaxLevel(grandParent[0], 2) && !tree.findByKeyAndMaxLevel(grandParent[1], 2)))
                }
            }

            if (eligibleMen.length) {
                const father = eligibleMen[Math.floor(Math.random() * eligibleMen.length)]
                eligiblePeople.push([woman, father])

                // TODO: check if we need to remove the father from the available men
            }

        }

        const smallestSize = Math.min(women.length, men.length)

        for (let i = 0; i < smallestSize; i++) {
            eligiblePeople.push([women[i], men[i]])
        }

        if (eligiblePeople.length) {
            for (const [mother, father] of eligiblePeople) {

                if (!isWithinChance(PREGNANCY_PROBABILITY)) {
                    continue
                }

                const occupations = [OccupationTypes.CARPENTER, OccupationTypes.FARMER, mother.work?.occupationType ?? OccupationTypes.CARPENTER, father.work?.occupationType ?? OccupationTypes.FARMER]
                const genders = [Gender.FEMALE, Gender.MALE]
                const newPerson = new People({
                    name: uniqueNamesGenerator({ dictionaries: [names] }),
                    month: 0,
                    gender: genders[Math.floor(Math.random() * genders.length)],
                    lifeCounter: 2,
                    lineage: {
                        mother: {
                            id: mother.id,
                            ...(mother.lineage && { lineage: mother.lineage })
                        },
                        father: {
                            id: father.id,
                            ...(father.lineage && { lineage: father.lineage })
                        }
                    }
                })
                newPerson.setOccupation(occupations[Math.floor(Math.random() * occupations.length)])

                mother.addChildToBirth(newPerson)

                mother.lifeCounter = Math.floor(mother.lifeCounter / 2)
                father.lifeCounter = Math.floor(father.lifeCounter / 2)
            }
        }
    }

    private birthAwaitingBabies() {
        const awaitingMothers = this._people.filter(({ pregnancyMonthsLeft, child }) => pregnancyMonthsLeft === 0 && child)

        for (const mother of awaitingMothers) {
            if (!mother.child) {
                continue
            }

            this.addPeople(mother.child)
            mother.giveBirth()
        }
    }

    private removeDeadPeople() {
        this._people = this._people.filter(person => person.isAlive())
    }
}
