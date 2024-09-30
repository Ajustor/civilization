import { BuildingTypes } from './buildings/enum'
import { House } from './buildings/house'
import { Civilization } from './civilization'
import { Gender } from './people/enum'
import { People } from './people/people'
import { OccupationTypes } from './people/work/enum'
import { Resource, ResourceTypes } from './resource'
import { World } from './world'

describe('Civilization', () => {

  let civilization: Civilization
  let world: World

  beforeEach(() => {

    civilization = new Civilization()
    world = new World()

  })

  // Civilization initializes with default values
  it('should initialize with default values when instantiated', () => {
    expect(civilization.name).toBeDefined()
    expect(civilization.people).toEqual([])
    expect(civilization.resources).toEqual([])
    expect(civilization.buildings).toEqual([])
    expect(civilization.livedMonths).toBe(0)
  })

  // Civilization with no people returns true for nobodyAlive
  it('should return true for nobodyAlive when there are no people', () => {
    expect(civilization.nobodyAlive()).toBe(true)
  })

  // Adding people to civilization updates the people list
  it('should update people list when adding people', () => {
    const person1 = new People({ name: 'Alice', month: 120, gender: Gender.FEMALE, lifeCounter: 3 })
    const person2 = new People({ name: 'Bob', month: 120, gender: Gender.MALE, lifeCounter: 3 })

    civilization.addPeople(person1, person2)

    expect(civilization.people).toContain(person1)
    expect(civilization.people).toContain(person2)
  })

  // Adding resources to civilization updates the resources list
  it('should update resources list when adding resources', () => {
    const initialResourceCount = civilization.resources.length

    civilization.addResource(new Resource(ResourceTypes.FOOD, 10))

    expect(civilization.resources.length).toBe(initialResourceCount + 1)
  })

  // Adding buildings to civilization updates the buildings list
  it('should update buildings list when adding a building', () => {
    const building = new House(4)
    civilization.addBuilding(building)
    expect(civilization.buildings).toContainEqual(building)
  })

  // Increasing resources updates the resource count correctly
  it('should increase the resource count correctly when a resource is added', () => {
    civilization.increaseResource(ResourceTypes.WOOD, 10)
    civilization.increaseResource(ResourceTypes.FOOD, 5)

    const woodResource = civilization.getResource(ResourceTypes.WOOD)
    const foodResource = civilization.getResource(ResourceTypes.FOOD)

    expect(woodResource.quantity).toBe(10)
    expect(foodResource.quantity).toBe(5)
  })

  // Decreasing resources updates the resource count correctly
  it('should update resource count correctly when decreasing resources', () => {
    civilization.addResource(new Resource(ResourceTypes.FOOD, 100))
    civilization.decreaseResource(ResourceTypes.FOOD, 50)
    const updatedFoodResource = civilization.getResource(ResourceTypes.FOOD)
    expect(updatedFoodResource.quantity).toBe(50)
  })

  // Constructing a building decreases the required resources
  it('should decrease required resources when constructing a building', () => {
    civilization.addResource(new Resource(ResourceTypes.WOOD, 20))
    civilization.constructBuilding(BuildingTypes.HOUSE, 4)
    const woodResource = civilization.getResource(ResourceTypes.WOOD)
    const houses = civilization.houses

    expect(woodResource.quantity).toBe(5)
    expect(houses?.count).toBe(1)
  })

  // Passing a month updates the civilization state correctly
  it('should update civilization state correctly after passing a month', () => {
    const person = new People({ name: 'Alice', gender: Gender.FEMALE, lifeCounter: 50, month: 0 })
    const person2 = new People({ name: 'Bob', gender: Gender.MALE, lifeCounter: 50, month: 0 })

    person.setOccupation(OccupationTypes.FARMER)
    person2.setOccupation(OccupationTypes.CARPENTER)
    civilization.addPeople(person, person2)
    civilization.addResource(new Resource(ResourceTypes.FOOD, 100))
    civilization.addResource(new Resource(ResourceTypes.WOOD, 100))
    civilization.addBuilding(new House(4, 1))
    world.addResource(new Resource(ResourceTypes.FOOD, 200))
    world.addResource(new Resource(ResourceTypes.WOOD, 200))

    civilization.passAMonth(world)

    expect(civilization.livedMonths).toBe(1)
    expect(civilization.resources.find(resource => resource.type === ResourceTypes.FOOD)?.quantity).toBeLessThan(100)
    expect(civilization.resources.find(resource => resource.type === ResourceTypes.WOOD)?.quantity).toBe(100)
    expect(civilization.people.every(person => person.lifeCounter >= 50)).toBeTruthy()
    expect(civilization.houses?.count).toBeGreaterThan(0)
  })

  // People with specific occupations can be retrieved correctly
  it('should retrieve people with specific occupations correctly', () => {
    const mockFarmer = new People({ name: 'Alice', gender: Gender.FEMALE, lifeCounter: 50, month: 0 })
    const mockCarpenter = new People({ name: 'Bob', gender: Gender.MALE, lifeCounter: 50, month: 0 })

    mockFarmer.setOccupation(OccupationTypes.FARMER)
    mockCarpenter.setOccupation(OccupationTypes.CARPENTER)
    civilization.addPeople(mockFarmer, mockCarpenter)

    const farmers = civilization.getPeopleWithOccupation(OccupationTypes.FARMER)
    const carpenters = civilization.getPeopleWithOccupation(OccupationTypes.CARPENTER)

    expect(farmers).toContain(mockFarmer)
    expect(carpenters).toContain(mockCarpenter)
  })

  it('should remove all dead people', () => {
    const person1 = new People({ name: 'Alice', gender: Gender.FEMALE, lifeCounter: 0, month: 0 })
    const person2 = new People({ name: 'Bob', gender: Gender.MALE, lifeCounter: 0, month: 0 })

    civilization.addPeople(person2, person1)
    civilization.passAMonth(world)

    expect(civilization.people).toStrictEqual([])
  })
})
