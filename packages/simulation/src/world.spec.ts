import { BASE_FOOD_GENERATION, BASE_WOOD_GENERATION, World } from './world'
import { Resource, ResourceTypes } from './resource'

import { Civilization } from './civilization'
import { Gender } from './people/enum'
import { People } from './people/people'
import { formatCivilizations } from './formatters'

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
    const civilization1 = new Civilization('GET Civilization 1')
    const civilization2 = new Civilization('GET Civilization 2')
    world.addCivilization(civilization1, civilization2)
    expect(world.civilizations).toEqual([civilization1, civilization2])
  })

  // Adding civilizations updates the civilizations list
  it('should update civilizations list when civilizations are added', () => {
    const world = new World()
    const civilization1 = new Civilization('UPDATE Civilization 1')
    const civilization2 = new Civilization('UPDATE Civilization 2')

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

  it('should return the good year', () => {
    const world = new World()

    world['month'] = 12
    expect(world.getYear()).toBe(1)
  })

  describe('should return the season corresponding', () => {
    it('should return spring', () => {
      const world = new World()
      expect(world.season).toBe('spring')
    })
    it('should return summer', () => {
      const world = new World()
      world['month'] = 3
      expect(world.season).toBe('summer')
    })
    it('should return automn', () => {
      const world = new World()
      world['month'] = 6
      expect(world.season).toBe('automn')
    })
    it('should return winter', () => {
      const world = new World()
      world['month'] = 9
      expect(world.season).toBe('winter')
    })

    it('should return a void string', () => {
      const world = new World()
      world['month'] = -1
      expect(world.season).toBe('')
    })
  })

  // Passing a month updates the month and resources based on the season
  describe('should update month and resources based on season when passing a month', () => {
    it('spring', async () => {
      const world = new World()
      const civilization = new Civilization()
      world.addCivilization(civilization)
      const mockFood = new Resource(ResourceTypes.FOOD, 100)
      const mockWood = new Resource(ResourceTypes.WOOD, 100)
      world.addResource(mockFood, mockWood)

      const decreaseSpy = jest.spyOn(world, 'decreaseResource')
      const increaseSpy = jest.spyOn(world, 'increaseResource')

      await world.passAMonth()
      const { month } = world.getInfos()

      expect(month).toBe(1)
      expect(decreaseSpy).toHaveBeenCalledTimes(0)
      expect(increaseSpy).toHaveBeenCalledTimes(2)
      expect(world.getResource(ResourceTypes.FOOD)?.quantity).toBe(100 + ~~(BASE_FOOD_GENERATION * 1.5))
      expect(world.getResource(ResourceTypes.WOOD)?.quantity).toBe(100 + ~~(BASE_WOOD_GENERATION * 1.1))
    })

    it('summer', async () => {
      const world = new World()
      const civilization = new Civilization()
      world.addCivilization(civilization)
      const mockFood = new Resource(ResourceTypes.FOOD, 100)
      const mockWood = new Resource(ResourceTypes.WOOD, 100)
      world.addResource(mockFood, mockWood)

      const decreaseSpy = jest.spyOn(world, 'decreaseResource')
      const increaseSpy = jest.spyOn(world, 'increaseResource')
      world['month'] = 2
      await world.passAMonth()
      const { month } = world.getInfos()

      expect(month).toBe(3)
      expect(decreaseSpy).toHaveBeenCalledTimes(0)
      expect(increaseSpy).toHaveBeenCalledTimes(2)
      expect(world.getResource(ResourceTypes.FOOD)?.quantity).toBe(100 + ~~(BASE_FOOD_GENERATION * 1.75))
      expect(world.getResource(ResourceTypes.WOOD)?.quantity).toBe(100 + ~~(BASE_WOOD_GENERATION * 1.2))
    })

    it('automn', async () => {
      const world = new World()
      const civilization = new Civilization()
      world.addCivilization(civilization)
      const mockFood = new Resource(ResourceTypes.FOOD, 100)
      const mockWood = new Resource(ResourceTypes.WOOD, 100)
      world.addResource(mockFood, mockWood)

      const decreaseSpy = jest.spyOn(world, 'decreaseResource')
      const increaseSpy = jest.spyOn(world, 'increaseResource')
      world['month'] = 5
      await world.passAMonth()
      const { month } = world.getInfos()

      expect(month).toBe(6)
      expect(decreaseSpy).toHaveBeenCalledTimes(0)
      expect(increaseSpy).toHaveBeenCalledTimes(2)
      expect(world.getResource(ResourceTypes.FOOD)?.quantity).toBe(100 + ~~(BASE_FOOD_GENERATION * 1.2))
      expect(world.getResource(ResourceTypes.WOOD)?.quantity).toBe(100 + ~~(BASE_WOOD_GENERATION))
    })

    it('winter', async () => {
      const world = new World()
      const civilization = new Civilization()
      world.addCivilization(civilization)
      const mockFood = new Resource(ResourceTypes.FOOD, 100)
      const mockWood = new Resource(ResourceTypes.WOOD, 100)
      world.addResource(mockFood, mockWood)

      const decreaseSpy = jest.spyOn(world, 'decreaseResource')
      const increaseSpy = jest.spyOn(world, 'increaseResource')
      world['month'] = 8
      await world.passAMonth()
      const { month } = world.getInfos()

      expect(month).toBe(9)
      expect(decreaseSpy).toHaveBeenCalledTimes(0)
      expect(increaseSpy).toHaveBeenCalledTimes(2)
      expect(world.getResource(ResourceTypes.FOOD)?.quantity).toBe(100 + ~~(BASE_FOOD_GENERATION * 0.5))
      expect(world.getResource(ResourceTypes.WOOD)?.quantity).toBe(100 + ~~(BASE_WOOD_GENERATION * 0.75))
    })
  })

  // Getting world information returns the correct formatted data
  it('should return formatted world information', () => {
    const world = new World()
    const worldFood = new Resource(ResourceTypes.FOOD, 5000)
    const worldWood = new Resource(ResourceTypes.WOOD, 2000)
    world.addResource(worldFood, worldWood)
    const civilization1 = new Civilization('FORMATTED Civilization 1')
    civilization1.id = 'civilizationId'
    const food = new Resource(ResourceTypes.FOOD, 500)
    const wood = new Resource(ResourceTypes.WOOD, 200)
    civilization1.addResource(food)
    civilization1.addResource(wood)
    world.addCivilization(civilization1)

    const expectedInfos = {
      id: '',
      name: 'The world',
      civilizations: [{
        name: 'FORMATTED Civilization 1', people: [], livedMonths: 0, buildings: [], id: 'civilizationId', citizensCount: 0, resources: [
          food.formatToType(),
          wood.formatToType()
        ]
      }],
      nextEvent: null,
      month: 0,
      resources: [
        worldFood.formatToType(),
        worldWood.formatToType()
      ],
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
    expect(async () => await world.passAMonth()).not.toThrow()
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

  it('should pass a month on civilizations', async () => {
    const world = new World()

    const worldFood = new Resource(ResourceTypes.FOOD, 5000)
    const worldWood = new Resource(ResourceTypes.WOOD, 2000)
    world.addResource(worldFood, worldWood)
    const civilization1 = new Civilization('Civilization 1')
    civilization1.addPeople(new People({ month: 200, lifeCounter: 12, gender: Gender.MALE }))

    civilization1.addResource(new Resource(ResourceTypes.FOOD, 10))
    world.addCivilization(civilization1)

    await world.passAMonth()

    for (const civilization of world.civilizations) {
      expect(civilization.livedMonths).toBe(1)
      expect(civilization.people.every(({ lifeCounter }) => lifeCounter === 11)).toBeTruthy()
    }
  })
})
