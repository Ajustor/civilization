import { Civilization } from './civilization'
import { formatCivilizations } from './formatters'
import { Resource, ResourceTypes } from './resource'
import { World } from './world'

describe('World', () => {

  // World instance initializes with default name and month
  it('should initialize with default name and month', () => {
    const world = new World()
    expect(world.getName()).toBe('The world')
    expect(world.getYear()).toBe(0)
  })

  // Getting a resource that does not exist returns undefined
  it('should return undefined when getting a non-existent resource', () => {
    const world = new World()
    expect(world.getResource('nonExistentResourceType' as ResourceTypes)).toBeUndefined()
  })

  // Adding resources updates the resources list
  it('should update resources list when adding resources', () => {
    const world = new World()
    const resource1 = new Resource(ResourceTypes.FOOD, 100)
    const resource2 = new Resource(ResourceTypes.WOOD, 50)

    world.addResource(resource1, resource2)

    expect(world.getResources()).toEqual([resource1, resource2])
  })

  // Getting civilizations returns the correct list of civilizations
  it('should return correct list of civilizations when getting civilizations', () => {
    const world = new World()
    const civilization1 = new Civilization('Civilization 1')
    const civilization2 = new Civilization('Civilization 2')
    world.addCivilization(civilization1, civilization2)
    expect(world.civilizations).toEqual([civilization1, civilization2])
  })

  // Adding civilizations updates the civilizations list
  it('should update civilizations list when civilizations are added', () => {
    const world = new World()
    const civilization1 = new Civilization('Civilization 1')
    const civilization2 = new Civilization('Civilization 2')

    world.addCivilization(civilization1, civilization2)

    expect(world.civilizations).toContain(civilization1)
    expect(world.civilizations).toContain(civilization2)
  })

  // Getting resources returns the correct list of resources
  it('should return correct list of resources when getResources is called', () => {
    const resource1 = new Resource(ResourceTypes.FOOD, 100)
    const resource2 = new Resource(ResourceTypes.WOOD, 200)
    const world = new World()
    world.addResource(resource1, resource2)

    const resources = world.getResources()

    expect(resources).toEqual([resource1, resource2])
  })

  // Getting a specific resource by type returns the correct resource
  it('should return correct resource when getResource is called with a valid type', () => {
    const world = new World()
    const foodResource = new Resource(ResourceTypes.FOOD, 100)
    const woodResource = new Resource(ResourceTypes.WOOD, 200)
    world.addResource(foodResource, woodResource)

    const retrievedFoodResource = world.getResource(ResourceTypes.FOOD)
    const retrievedWoodResource = world.getResource(ResourceTypes.WOOD)

    expect(retrievedFoodResource).toBe(foodResource)
    expect(retrievedWoodResource).toBe(woodResource)
  })

  // Increasing a resource updates its quantity correctly
  it('should increase resource quantity correctly', () => {
    const world = new World()
    const resource = new Resource(ResourceTypes.FOOD, 100)
    world.addResource(resource)

    world.increaseResource(ResourceTypes.FOOD, 50)

    expect(world.getResource(ResourceTypes.FOOD)?.quantity).toBe(150)
  })

  // Decreasing a resource updates its quantity correctly
  it('should update resource quantity correctly when decreasing', () => {
    const world = new World()
    const mockResource = new Resource(ResourceTypes.FOOD, 100)
    world.addResource(mockResource)

    const initialQuantity = mockResource.quantity
    world.decreaseResource(ResourceTypes.FOOD, 50)

    expect(mockResource.quantity).toBe(initialQuantity - 50)
  })

  // Passing a month updates the month and resources based on the season
  it('should update month and resources based on season when passing a month', () => {
    const world = new World()
    const civilization = new Civilization()
    world.addCivilization(civilization)
    const decreaseSpy = jest.spyOn(world, 'decreaseResource')
    const increaseSpy = jest.spyOn(world, 'increaseResource')

    world.passAMonth()
    const { month } = world.getInfos()

    expect(month).toBe(2)
    expect(decreaseSpy).toHaveBeenCalledTimes(0)
    expect(increaseSpy).toHaveBeenCalledTimes(2)
  })

  // Getting world information returns the correct formatted data
  it('should return formatted world information', () => {
    const world = new World()
    const civilization1 = new Civilization('Civilization 1')
    civilization1.id = 'civilizationId'
    civilization1.addResource(new Resource(ResourceTypes.FOOD, 500))
    civilization1.addResource(new Resource(ResourceTypes.WOOD, 200))
    world.addCivilization(civilization1)

    const expectedInfos = {
      id: '',
      name: 'The world',
      civilizations: [{ name: 'Civilization 1', people: [], livedMonths: 0, buildings: [], id: 'civilizationId', resources: [{ type: 'food', quantity: 500 }, { type: 'wood', quantity: 200 }] }],
      month: 1,
      resources: [],
      year: 0
    }

    expect(world.getInfos()).toEqual(expectedInfos)
  })

  // Decreasing a resource that does not exist does nothing
  it('should not decrease a non-existing resource', () => {
    const world = new World()
    const decreaseSpy = jest.spyOn(Resource.prototype, 'decrease')

    world.decreaseResource(ResourceTypes.FOOD, 10)

    expect(decreaseSpy).not.toHaveBeenCalled()
  })

  // Increasing a resource that does not exist does nothing
  it('should not increase a non-existing resource', () => {
    const world = new World()
    const resourceType = 'WATER' as ResourceTypes
    const initialResources = world.getResources().length

    world.increaseResource(resourceType, 100)

    expect(world.getResources().length).toBe(initialResources)
  })

  // Passing a month when there are no civilizations does not throw an error
  it('should not throw an error when passing a month with no civilizations', () => {
    const world = new World()
    expect(() => world.passAMonth()).not.toThrow()
  })

  // World instance initializes with an empty id
  it('should initialize with empty id', () => {
    const world = new World()
    expect(world.id).toBe('')
  })

  // Adding multiple civilizations at once updates the civilizations list correctly
  it('should update civilizations list when adding multiple civilizations', () => {
    const world = new World()
    const civilization1 = new Civilization('Civilization 1')
    const civilization2 = new Civilization('Civilization 2')

    world.addCivilization(civilization1, civilization2)

    expect(world.civilizations).toContain(civilization1)
    expect(world.civilizations).toContain(civilization2)
  })

  // Adding multiple resources at once updates the resources list correctly
  it('should update resources list when adding multiple resources', () => {
    const world = new World()
    const resource1 = new Resource(ResourceTypes.FOOD, 100)
    const resource2 = new Resource(ResourceTypes.WOOD, 50)

    world.addResource(resource1, resource2)

    expect(world.getResources()).toEqual([resource1, resource2])
  })

  // World information correctly formats civilizations
  it('should format civilizations correctly when getting world information', () => {
    const world = new World()
    const civilization1 = new Civilization('Civilization 1')
    const civilization2 = new Civilization('Civilization 2')
    world.addCivilization(civilization1, civilization2)

    const formattedCivilizations = formatCivilizations([civilization1, civilization2])

    expect(world.getInfos().civilizations).toEqual(formattedCivilizations)
  })
})
