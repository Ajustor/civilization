const isWithinChance = jest.fn()

jest.mock('./utils', () => ({ isWithinChance }))

import { EAT_FACTOR, LIFE_EXPECTANCY, People } from './people/people'
import { Resource, ResourceTypes } from './resource'

import { BuildingTypes } from './buildings/enum'
import { Carpenter } from './people/work/carpenter'
import { Civilization } from './civilization'
import { Farmer } from './people/work/farmer'
import { Gender } from './people/enum'
import { House } from './buildings/house'
import { OccupationTypes } from './people/work/enum'
import { PeopleBuilder } from './builders'
import { World } from './world'

describe('Civilization', () => {

  let civilization: Civilization
  let world: World

  const mockMath = Object.create(global.Math)

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
  it('should decrease required resources when building something', () => {
    civilization.addResource(new Resource(ResourceTypes.WOOD, 20))
    civilization.constructBuilding(BuildingTypes.HOUSE, 4)
    const woodResource = civilization.getResource(ResourceTypes.WOOD)
    const houses = civilization.houses

    expect(woodResource.quantity).toBe(5)
    expect(houses?.count).toBe(1)
  })

  // Passing a month updates the civilization state correctly
  it('should update civilization state correctly after passing a month', async () => {
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

    await civilization.passAMonth(world)

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

  it('should retrieve people without a specific occupation correctly', () => {
    const mockFarmer = new People({ name: 'Alice', gender: Gender.FEMALE, lifeCounter: 50, month: 0 })
    const mockCarpenter = new People({ name: 'Bob', gender: Gender.MALE, lifeCounter: 50, month: 0 })

    mockFarmer.setOccupation(OccupationTypes.FARMER)
    mockCarpenter.setOccupation(OccupationTypes.CARPENTER)
    civilization.addPeople(mockFarmer, mockCarpenter)

    const notFarmers = civilization.getPeopleWithoutOccupation(OccupationTypes.FARMER)
    const notCarpenters = civilization.getPeopleWithoutOccupation(OccupationTypes.CARPENTER)

    expect(notCarpenters).toContain(mockFarmer)
    expect(notFarmers).toContain(mockCarpenter)
  })

  it('should remove all dead people', async () => {
    const person1 = new People({ name: 'Alice', gender: Gender.FEMALE, lifeCounter: 0, month: 0 })
    const person2 = new People({ name: 'Bob', gender: Gender.MALE, lifeCounter: 0, month: 0 })

    civilization.addPeople(person2, person1)
    await civilization.passAMonth(world)

    expect(civilization.people).toStrictEqual([])
  })

  describe('civilization pass a month', () => {


    it('Should return all workers who can retire', () => {
      const person1 = new People({ name: 'Carpenter Alice', gender: Gender.FEMALE, lifeCounter: 50, month: 721 })
      const person2 = new People({ name: 'Farmer Alice', gender: Gender.FEMALE, lifeCounter: 50, month: 721 })
      const person3 = new People({ name: 'Farmer Bob', gender: Gender.MALE, lifeCounter: 50, month: 841 })
      const person4 = new People({ name: 'Carpenter Baby Bob', gender: Gender.MALE, lifeCounter: 50, month: 100 })

      person1.setOccupation(OccupationTypes.CARPENTER)
      person2.setOccupation(OccupationTypes.FARMER)
      person3.setOccupation(OccupationTypes.FARMER)
      person4.setOccupation(OccupationTypes.CARPENTER)

      civilization.addPeople(person1, person2, person3, person4)

      const people = civilization.getWorkersWhoCanRetire()

      expect(people.length).toBe(2)
      expect(people.map(({ name }) => name)).toStrictEqual(['Carpenter Alice', 'Farmer Bob'])
    })


    it('Should change occupation of people who can retire', async () => {
      civilization.name = 'retirePeople'
      const person1 = new People({ name: 'Carpenter Alice', gender: Gender.FEMALE, lifeCounter: 50, month: 721 })
      const person2 = new People({ name: 'Farmer Alice', gender: Gender.FEMALE, lifeCounter: 50, month: 721 })
      const person3 = new People({ name: 'Farmer Bob', gender: Gender.MALE, lifeCounter: 50, month: 841 })
      const person4 = new People({ name: 'Carpenter Baby Bob', gender: Gender.MALE, lifeCounter: 50, month: 100 })

      person1.setOccupation(OccupationTypes.CARPENTER)
      person2.setOccupation(OccupationTypes.FARMER)
      person3.setOccupation(OccupationTypes.FARMER)
      person4.setOccupation(OccupationTypes.CARPENTER)

      civilization.addPeople(person1, person2, person3, person4)
      await civilization.passAMonth(world)

      const retired = civilization.getPeopleWithOccupation(OccupationTypes.RETIRED)
      expect(civilization.people.length).toBe(4)
      expect(retired.length).toBe(2)
      expect(retired.map(({ name }) => name)).toStrictEqual(['Carpenter Alice', 'Farmer Bob'])
    })

    it('should remove all dead people', async () => {
      civilization.name = 'removeDead'
      isWithinChance.mockReturnValue(true)

      const person1 = new People({ name: 'Alice', gender: Gender.FEMALE, lifeCounter: 0, month: 0 })
      const person2 = new People({ name: 'Bob', gender: Gender.MALE, lifeCounter: 0, month: 0 })
      const person3 = new People({ name: 'Old Bob', gender: Gender.MALE, lifeCounter: 12, month: LIFE_EXPECTANCY * 12 + 3 })

      civilization.addPeople(person2, person1, person3)
      await civilization.passAMonth(world)

      expect(civilization.people).toStrictEqual([])
    })

    it('should remove all dead people except the old ones who are defying death', async () => {
      civilization.name = 'defyingDeath'
      isWithinChance.mockReturnValue(false)

      const person1 = new People({ name: 'Old Alice ', gender: Gender.FEMALE, lifeCounter: 12, month: LIFE_EXPECTANCY * 12 + 10 })
      const person2 = new People({ name: 'Sick Bob', gender: Gender.MALE, lifeCounter: 0, month: 0 })
      const person3 = new People({ name: 'Old Bob', gender: Gender.MALE, lifeCounter: 12, month: LIFE_EXPECTANCY * 12 + 3 })

      civilization.addPeople(person2, person1, person3)
      await civilization.passAMonth(world)

      expect(civilization.people).toStrictEqual([person1, person3])
    })

    it('should create new born', async () => {
      civilization.name = 'createNewBorn'
      const child = new PeopleBuilder().withGender(Gender.MALE).withOccupation(OccupationTypes.CARPENTER).withName('Patrique').build()
      const person1 = new PeopleBuilder()
        .withGender(Gender.FEMALE)
        .withLifeCounter(50)
        .withMonth(240)
        .withName('Carole')
        .withOccupation(OccupationTypes.FARMER)
        .withChild(child)
        .withPregnancyMonthsLeft(0)
        .build()

      const decreaseSpy = jest.spyOn(person1, 'giveBirth')

      civilization.addPeople(person1)
      await civilization.passAMonth(world)

      expect(person1.canConceive()).toBe(true)
      expect(decreaseSpy).toHaveBeenCalled()

      for (const person of civilization.people) {
        expect(person.child).toBe(null)
      }
    })

    describe('should set mother pregnant', () => {
      it('mother and father has no link', async () => {
        civilization.name = 'setPregnantNoLink'
        isWithinChance.mockReturnValue(true)
        const person1 = new PeopleBuilder()
          .withGender(Gender.FEMALE)
          .withLifeCounter(50)
          .withMonth(240)
          .withName('Carole')
          .withOccupation(OccupationTypes.FARMER)
          .withId('p1')
          .withLineage({ mother: { id: 'nope' }, father: { id: 'nope' } })
          .build()
        const person2 = new PeopleBuilder()
          .withGender(Gender.MALE)
          .withLifeCounter(50)
          .withMonth(240)
          .withName('Yves')
          .withOccupation(OccupationTypes.FARMER)
          .withId('p2')
          .withLineage({ mother: { id: 'mother' }, father: { id: 'father' } })
          .build()

        civilization.addPeople(person1, person2)
        civilization.addBuilding(new House(4, 1))
        civilization.addResource(new Resource(ResourceTypes.FOOD, 100))
        await civilization.passAMonth(world)
        const child = person1.child

        expect(person1.lifeCounter).toBe(25)
        expect(person2.lifeCounter).toBe(25)
        expect(child).toBeDefined()
        expect(child?.lineage).toStrictEqual({ mother: { id: person1.id, lineage: { father: { id: 'nope' }, mother: { id: 'nope' } } }, father: { id: person2.id, lineage: { mother: { id: 'mother' }, father: { id: 'father' } } } })
        expect(child?.work).toBeDefined()
        expect([OccupationTypes.CARPENTER, OccupationTypes.FARMER].includes(child!.work!.occupationType)).toBeTruthy()
        expect(child?.gender).toBeDefined()
        expect([Gender.FEMALE, Gender.MALE].includes(child!.gender)).toBeTruthy()
      })

      it('mother has no lineage', async () => {
        civilization.name = 'setPregnantNoLineageForMother'

        isWithinChance.mockReturnValue(true)
        const person1 = new PeopleBuilder()
          .withGender(Gender.FEMALE)
          .withLifeCounter(50)
          .withMonth(240)
          .withName('Carole')
          .withOccupation(OccupationTypes.FARMER)
          .withId('p1')
          .build()
        const person2 = new PeopleBuilder()
          .withGender(Gender.MALE)
          .withLifeCounter(50)
          .withMonth(240)
          .withName('Yves')
          .withOccupation(OccupationTypes.FARMER)
          .withId('p2')
          .withLineage({ mother: { id: 'mother' }, father: { id: 'father' } })
          .build()

        civilization.addPeople(person1, person2)
        civilization.addBuilding(new House(4, 1))
        civilization.addResource(new Resource(ResourceTypes.FOOD, 100))
        await civilization.passAMonth(world)
        const child = person1.child

        expect(person1.lifeCounter).toBe(25)
        expect(person2.lifeCounter).toBe(25)
        expect(child).toBeDefined()
        expect(child?.lineage).toStrictEqual({ mother: { id: person1.id }, father: { id: person2.id, lineage: { mother: { id: 'mother' }, father: { id: 'father' } } } })
        expect(child?.work).toBeDefined()
        expect([OccupationTypes.CARPENTER, OccupationTypes.FARMER].includes(child!.work!.occupationType)).toBeTruthy()
        expect(child?.gender).toBeDefined()
        expect([Gender.FEMALE, Gender.MALE].includes(child!.gender)).toBeTruthy()
      })

      it('father has no lineage', async () => {
        civilization.name = 'setPregnantNoLineageForFather'

        isWithinChance.mockReturnValue(true)
        const person1 = new PeopleBuilder()
          .withGender(Gender.FEMALE)
          .withLifeCounter(50)
          .withMonth(240)
          .withName('Carole')
          .withOccupation(OccupationTypes.FARMER)
          .withId('p1')
          .withLineage({ mother: { id: 'nope' }, father: { id: 'nope' } })
          .build()
        const person2 = new PeopleBuilder()
          .withGender(Gender.MALE)
          .withLifeCounter(50)
          .withMonth(240)
          .withName('Yves')
          .withOccupation(OccupationTypes.FARMER)
          .withId('p2')
          .build()

        civilization.addPeople(person1, person2)
        civilization.addBuilding(new House(4, 1))
        civilization.addResource(new Resource(ResourceTypes.FOOD, 100))
        await civilization.passAMonth(world)
        const child = person1.child

        expect(person1.lifeCounter).toBe(25)
        expect(person2.lifeCounter).toBe(25)
        expect(child).toBeDefined()
        expect(child?.lineage).toStrictEqual({ mother: { id: person1.id, lineage: { father: { id: 'nope' }, mother: { id: 'nope' } } }, father: { id: person2.id } })
        expect(child?.work).toBeDefined()
        expect([OccupationTypes.CARPENTER, OccupationTypes.FARMER].includes(child!.work!.occupationType)).toBeTruthy()
        expect(child?.gender).toBeDefined()
        expect([Gender.FEMALE, Gender.MALE].includes(child!.gender)).toBeTruthy()
      })
    })

    it('should set mother pregnant with a female carpenter child', async () => {
      civilization.name = 'setPregnantWithFemaleCarpenter'
      mockMath.random = () => 0
      global.Math = mockMath
      isWithinChance.mockReturnValue(true)
      const person1 = new PeopleBuilder()
        .withGender(Gender.FEMALE)
        .withLifeCounter(50)
        .withMonth(240)
        .withName('Carole')
        .withOccupation(OccupationTypes.FARMER)
        .withId('p1')
        .withLineage({ mother: { id: 'nope' }, father: { id: 'nope' } })
        .build()
      const person2 = new PeopleBuilder()
        .withGender(Gender.MALE)
        .withLifeCounter(50)
        .withMonth(240)
        .withName('Yves')
        .withOccupation(OccupationTypes.FARMER)
        .withId('p2')
        .withLineage({ mother: { id: 'mother' }, father: { id: 'father' } })
        .build()

      civilization.addPeople(person1, person2)
      civilization.addBuilding(new House(4, 1))
      civilization.addResource(new Resource(ResourceTypes.FOOD, 100))
      await civilization.passAMonth(world)
      const child = person1.child

      expect(person1.lifeCounter).toBe(25)
      expect(person2.lifeCounter).toBe(25)
      expect(child).toBeDefined()
      expect(child?.lineage).toStrictEqual({ mother: { id: person1.id, lineage: { father: { id: 'nope' }, mother: { id: 'nope' } } }, father: { id: person2.id, lineage: { mother: { id: 'mother' }, father: { id: 'father' } } } })
      expect(child?.work).toBeDefined()
      expect(child!.work).toBeInstanceOf(Carpenter)
      expect(child?.gender).toBeDefined()
      expect(child!.gender).toBe(Gender.FEMALE)
    })

    it('should set mother pregnant with a male farmer child', async () => {
      civilization.name = 'setPregnantWithMaleFarmer'
      mockMath.random = () => 1
      global.Math = mockMath
      isWithinChance.mockReturnValue(true)
      const person1 = new PeopleBuilder()
        .withGender(Gender.FEMALE)
        .withLifeCounter(50)
        .withMonth(240)
        .withName('Carole')
        .withOccupation(OccupationTypes.FARMER)
        .withId('p1')
        .withLineage({ mother: { id: 'nope' }, father: { id: 'nope' } })
        .build()
      const person2 = new PeopleBuilder()
        .withGender(Gender.MALE)
        .withLifeCounter(50)
        .withMonth(240)
        .withName('Yves')
        .withOccupation(OccupationTypes.FARMER)
        .withId('p2')
        .withLineage({ mother: { id: 'mother' }, father: { id: 'father' } })
        .build()

      civilization.addPeople(person1, person2)
      civilization.addBuilding(new House(4, 1))
      civilization.addResource(new Resource(ResourceTypes.FOOD, 100))
      await civilization.passAMonth(world)
      const child = person1.child

      expect(person1.lifeCounter).toBe(25)
      expect(person2.lifeCounter).toBe(25)
      expect(child).toBeDefined()
      expect(child?.lineage).toStrictEqual({ mother: { id: person1.id, lineage: { father: { id: 'nope' }, mother: { id: 'nope' } } }, father: { id: person2.id, lineage: { mother: { id: 'mother' }, father: { id: 'father' } } } })
      expect(child?.work).toBeDefined()
      expect(child!.work).toBeInstanceOf(Farmer)
      expect(child?.gender).toBeDefined()
      expect(child!.gender).toBe(Gender.MALE)
    })

    it('should not set mother pregnant', async () => {
      civilization.name = 'notSetPregnant'
      isWithinChance.mockReturnValue(false)
      const person1 = new PeopleBuilder()
        .withGender(Gender.FEMALE)
        .withLifeCounter(50)
        .withMonth(240)
        .withName('Carole')
        .withOccupation(OccupationTypes.FARMER)
        .withId('p1')
        .withLineage({ mother: { id: 'nope' }, father: { id: 'nope' } })
        .build()
      const person2 = new PeopleBuilder()
        .withGender(Gender.MALE)
        .withLifeCounter(50)
        .withMonth(240)
        .withName('Yves')
        .withOccupation(OccupationTypes.FARMER)
        .withId('p2')
        .withLineage({ mother: { id: 'mother' }, father: { id: 'father' } })
        .build()

      civilization.addPeople(person1, person2)
      civilization.addBuilding(new House(4, 1))
      civilization.addResource(new Resource(ResourceTypes.FOOD, 100))
      await civilization.passAMonth(world)
      const child = person1.child

      expect(person1.lifeCounter).toBe(50)
      expect(person2.lifeCounter).toBe(50)
      expect(child).toBeFalsy()
    })

    it('should not set mother pregnant because other male is her brother', async () => {
      civilization.name = 'notSetPregnantBrotherCase'

      isWithinChance.mockReturnValue(true)
      const person1 = new PeopleBuilder()
        .withGender(Gender.FEMALE)
        .withLifeCounter(50)
        .withMonth(240)
        .withName('Carole')
        .withOccupation(OccupationTypes.FARMER)
        .withId('p1')
        .withLineage({ mother: { id: 'mother' }, father: { id: 'nope' } })
        .build()
      const person2 = new PeopleBuilder()
        .withGender(Gender.MALE)
        .withLifeCounter(50)
        .withMonth(240)
        .withName('Yves')
        .withOccupation(OccupationTypes.FARMER)
        .withId('p2')
        .withLineage({ mother: { id: 'mother' }, father: { id: 'father' } })
        .build()

      civilization.addPeople(person1, person2)
      civilization.addBuilding(new House(4, 1))
      civilization.addResource(new Resource(ResourceTypes.FOOD, 100))
      await civilization.passAMonth(world)
      const child = person1.child

      expect(person1.lifeCounter).toBe(50)
      expect(person2.lifeCounter).toBe(50)
      expect(child).toBeFalsy()
    })

    it('should not set mother pregnant because other male is her father', async () => {
      civilization.name = 'notSetPregnantUncleCase'

      isWithinChance.mockReturnValue(true)
      const person1 = new PeopleBuilder()
        .withGender(Gender.FEMALE)
        .withLifeCounter(50)
        .withMonth(240)
        .withName('Carole')
        .withOccupation(OccupationTypes.FARMER)
        .withId('p1')
        .withLineage({ mother: { id: 'nope', lineage: { mother: { id: 'mother' }, father: { id: 'yep' } } }, father: { id: 'fope' } })
        .build()
      const person2 = new PeopleBuilder()
        .withGender(Gender.MALE)
        .withLifeCounter(50)
        .withMonth(240)
        .withName('Yves')
        .withOccupation(OccupationTypes.FARMER)
        .withId('p2')
        .withLineage({ mother: { id: 'mother' }, father: { id: 'p1' } })
        .build()

      civilization.addPeople(person1, person2)
      civilization.addBuilding(new House(4, 1))
      civilization.addResource(new Resource(ResourceTypes.FOOD, 100))
      await civilization.passAMonth(world)
      const child = person1.child

      expect(person1.lifeCounter).toBe(50)
      expect(person2.lifeCounter).toBe(50)
      expect(child).toBeFalsy()
    })

    describe('Resource consumption', () => {
      it('Should eat food', async () => {
        const person1 = new PeopleBuilder()
          .withGender(Gender.FEMALE)
          .withLifeCounter(50)
          .withMonth(240)
          .withName('Carole')
          .withOccupation(OccupationTypes.FARMER)
          .withId('p1')
          .build()
        const person2 = new PeopleBuilder()
          .withGender(Gender.MALE)
          .withLifeCounter(50)
          .withMonth(240)
          .withName('Yves')
          .withOccupation(OccupationTypes.FARMER)
          .withId('p2')
          .build()

        civilization.addPeople(person1, person2)
        civilization.addBuilding(new House(4, 1))
        civilization.addResource(new Resource(ResourceTypes.FOOD, 100))
        await civilization.passAMonth(world)

        expect(civilization.getResource(ResourceTypes.FOOD).quantity).toBe(100 - civilization.people.reduce((acc, person) => EAT_FACTOR[person.work!.occupationType] + acc, 0))
      })

      describe('wood consumption', () => {
        it('Should use wood in winter', async () => {
          const person1 = new PeopleBuilder()
            .withGender(Gender.FEMALE)
            .withLifeCounter(50)
            .withMonth(240)
            .withName('Carole')
            .withOccupation(OccupationTypes.FARMER)
            .withId('p1')
            .build()
          const person2 = new PeopleBuilder()
            .withGender(Gender.MALE)
            .withLifeCounter(50)
            .withMonth(240)
            .withName('Yves')
            .withOccupation(OccupationTypes.FARMER)
            .withId('p2')
            .build()

          world['month'] = 9

          civilization.addPeople(person1, person2)
          civilization.addBuilding(new House(4, 1))
          civilization.addResource(new Resource(ResourceTypes.WOOD, 100))
          civilization.addResource(new Resource(ResourceTypes.FOOD, 100))
          await civilization.passAMonth(world)

          expect(civilization.getResource(ResourceTypes.WOOD).quantity).toBe(100 - 3 * civilization.people.length)
        })

        it('Should use wood in automn', async () => {
          const person1 = new PeopleBuilder()
            .withGender(Gender.FEMALE)
            .withLifeCounter(50)
            .withMonth(240)
            .withName('Carole')
            .withOccupation(OccupationTypes.FARMER)
            .withId('p1')
            .build()
          const person2 = new PeopleBuilder()
            .withGender(Gender.MALE)
            .withLifeCounter(50)
            .withMonth(240)
            .withName('Yves')
            .withOccupation(OccupationTypes.FARMER)
            .withId('p2')
            .build()

          world['month'] = 6

          civilization.addPeople(person1, person2)
          civilization.addBuilding(new House(4, 1))
          civilization.addResource(new Resource(ResourceTypes.WOOD, 100))
          civilization.addResource(new Resource(ResourceTypes.FOOD, 100))
          await civilization.passAMonth(world)

          expect(civilization.getResource(ResourceTypes.WOOD).quantity).toBe(100 - 2 * civilization.people.length)
        })
      })


    })
  })
})
