const isWithinChance = jest.fn()

jest.mock('./utils', () => ({ isWithinChance }))

import { LIFE_EXPECTANCY, People } from './people/people'
import { Resource, ResourceTypes } from './resource'

import { Civilization } from './civilization'
import { Farm } from './buildings/farm'
import { Gender } from './people/enum'
import { House } from './buildings/house'
import { Kiln } from './buildings/kiln'
import { OccupationTypes } from './people/work/enum'
import { PeopleBuilder } from './builders'
import { Sawmill } from './buildings/sawmill'
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
    const person1 = new People({
      month: 120,
      gender: Gender.FEMALE,
      lifeCounter: 3,
    })
    const person2 = new People({
      month: 120,
      gender: Gender.MALE,
      lifeCounter: 3,
    })

    civilization.addPeople(person1, person2)

    expect(civilization.people).toContain(person1)
    expect(civilization.people).toContain(person2)
  })

  // Adding resources to civilization updates the resources list
  it('should update resources list when adding resources', () => {
    const initialResourceCount = civilization.resources.length

    civilization.addResource(new Resource(ResourceTypes.RAW_FOOD, 10))

    expect(civilization.resources.length).toBe(initialResourceCount + 1)
  })

  // Adding buildings to civilization updates the buildings list
  it('should update buildings list when adding a building', () => {
    const building = new House(1)
    civilization.addBuilding(building)
    expect(civilization.buildings).toContainEqual(building)
  })

  // Increasing resources updates the resource count correctly
  it('should increase the resource count correctly when a resource is added', () => {
    civilization.increaseResource(ResourceTypes.WOOD, 10)
    civilization.increaseResource(ResourceTypes.RAW_FOOD, 5)

    const woodResource = civilization.getResource(ResourceTypes.WOOD)
    const foodResource = civilization.getResource(ResourceTypes.RAW_FOOD)

    expect(woodResource.quantity).toBe(10)
    expect(foodResource.quantity).toBe(5)
  })

  // Decreasing resources updates the resource count correctly
  it('should update resource count correctly when decreasing resources', () => {
    civilization.addResource(new Resource(ResourceTypes.RAW_FOOD, 100))
    civilization.decreaseResource(ResourceTypes.RAW_FOOD, 50)
    const updatedFoodResource = civilization.getResource(ResourceTypes.RAW_FOOD)
    expect(updatedFoodResource.quantity).toBe(50)
  })

  // Passing a month updates the civilization state correctly
  it('should update civilization state correctly after passing a month', async () => {
    const person = new People({
      gender: Gender.FEMALE,
      lifeCounter: 12,
      month: 0,
    })
    const person2 = new People({
      gender: Gender.MALE,
      lifeCounter: 12,
      month: 0,
    })

    person.setOccupation(OccupationTypes.FARMER)
    person2.setOccupation(OccupationTypes.WOODCUTTER)
    civilization.addPeople(person, person2)
    civilization.addResource(new Resource(ResourceTypes.RAW_FOOD, 100))
    civilization.addResource(new Resource(ResourceTypes.WOOD, 100))
    civilization.addBuilding(new House(1))
    world.addResource(new Resource(ResourceTypes.RAW_FOOD, 200))
    world.addResource(new Resource(ResourceTypes.WOOD, 200))

    await civilization.passAMonth(world)

    expect(civilization.livedMonths).toBe(1)
    expect(
      civilization.resources.find(
        (resource) => resource.type === ResourceTypes.RAW_FOOD,
      )?.quantity,
    ).toBeLessThan(100)
    expect(
      civilization.resources.find(
        (resource) => resource.type === ResourceTypes.WOOD,
      )?.quantity,
    ).toBe(110)
    expect(
      civilization.people.every((person) => person.lifeCounter >= 12),
    ).toBeTruthy()
    expect(civilization.houses?.count).toBeGreaterThan(0)
  })

  // People with specific occupations can be retrieved correctly
  it('should retrieve people with specific occupations correctly', () => {
    const mockFarmer = new People({
      gender: Gender.FEMALE,
      lifeCounter: 12,
      month: 0,
    })
    const mockCarpenter = new People({
      gender: Gender.MALE,
      lifeCounter: 12,
      month: 0,
    })

    mockFarmer.setOccupation(OccupationTypes.FARMER)
    mockCarpenter.setOccupation(OccupationTypes.WOODCUTTER)
    civilization.addPeople(mockFarmer, mockCarpenter)

    const farmers = civilization.getPeopleWithOccupation(OccupationTypes.FARMER)
    const carpenters = civilization.getPeopleWithOccupation(
      OccupationTypes.WOODCUTTER,
    )

    expect(farmers).toContain(mockFarmer)
    expect(carpenters).toContain(mockCarpenter)
  })

  it('should retrieve people without a specific occupation correctly', () => {
    const mockFarmer = new People({
      gender: Gender.FEMALE,
      lifeCounter: 12,
      month: 0,
    })
    const mockCarpenter = new People({
      gender: Gender.MALE,
      lifeCounter: 12,
      month: 0,
    })

    mockFarmer.setOccupation(OccupationTypes.FARMER)
    mockCarpenter.setOccupation(OccupationTypes.WOODCUTTER)
    civilization.addPeople(mockFarmer, mockCarpenter)

    const notFarmers = civilization.getPeopleWithoutOccupation(
      OccupationTypes.FARMER,
    )
    const notCarpenters = civilization.getPeopleWithoutOccupation(
      OccupationTypes.WOODCUTTER,
    )

    expect(notCarpenters).toContain(mockFarmer)
    expect(notFarmers).toContain(mockCarpenter)
  })

  it('should remove all dead people', async () => {
    const person1 = new People({
      gender: Gender.FEMALE,
      lifeCounter: 0,
      month: 0,
    })
    const person2 = new People({
      gender: Gender.MALE,
      lifeCounter: 0,
      month: 0,
    })

    civilization.addPeople(person2, person1)
    await civilization.passAMonth(world)

    expect(civilization.people).toStrictEqual([])
  })

  describe('civilization pass a month', () => {
    describe('Adapt people', () => {
      it('should not upgrade gatherer', async () => {
        isWithinChance.mockReturnValue(true)
        const person = new PeopleBuilder()
          .withMonth(500)
          .withOccupation(OccupationTypes.GATHERER)
          .build()
        civilization.addPeople(person)
        await civilization.passAMonth(world)
        expect(person.work?.occupationType).toBe(OccupationTypes.GATHERER)
      })

      it('should not upgrade gatherer but upgrade woodcutter', async () => {
        mockMath.random = () => 1
        global.Math = mockMath
        isWithinChance.mockReturnValue(true)
        const person1 = new PeopleBuilder()
          .withMonth(500)
          .withId('ID2')
          .withOccupation(OccupationTypes.GATHERER)
          .build()
        const person2 = new PeopleBuilder()
          .withMonth(500)
          .withId('ID1')
          .withOccupation(OccupationTypes.WOODCUTTER)
          .build()
        civilization.addPeople(person1, person2)
        civilization.addBuilding(new Kiln(1))

        await civilization.passAMonth(world)
        expect(person1.work?.occupationType).toBe(OccupationTypes.GATHERER)
        expect(person2.work?.occupationType).toBe(
          OccupationTypes.CHARCOAL_BURNER,
        )
      })

      it('should upgrade gatherer to farmer', async () => {
        mockMath.random = () => 0
        global.Math = mockMath
        isWithinChance.mockReturnValue(true)
        const person = new PeopleBuilder()
          .withMonth(500)
          .withOccupation(OccupationTypes.GATHERER)
          .build()
        civilization.addBuilding(new Farm(1))
        civilization.addPeople(person)
        await civilization.passAMonth(world)
        expect(person.work?.occupationType).toBe(OccupationTypes.FARMER)
      })
    })

    describe('Testing buildings', () => {
      it('should decrease required resources when building house', async () => {
        civilization.addResource(new Resource(ResourceTypes.WOOD, 20))
        const person = new PeopleBuilder()
          .withMonth(500)
          .withOccupation(OccupationTypes.GATHERER)
          .build()
        civilization.addPeople(person)

        await civilization.passAMonth(world)

        const woodResource = civilization.getResource(ResourceTypes.WOOD)
        const houses = civilization.houses

        expect(woodResource.quantity).toBe(5)
        expect(houses?.count).toBe(1)
        expect(person.canWork()).toBeFalsy()
      })

      it('should not build houses', async () => {
        civilization.addResource(new Resource(ResourceTypes.WOOD, 10))
        const person = new PeopleBuilder()
          .withMonth(500)
          .withOccupation(OccupationTypes.GATHERER)
          .build()
        civilization.addPeople(person)

        await civilization.passAMonth(world)

        const woodResource = civilization.getResource(ResourceTypes.WOOD)
        const houses = civilization.houses

        expect(woodResource.quantity).toBe(10)
        expect(houses?.count).toBe(undefined)
        expect(person.canWork()).toBeTruthy()
      })

      it('should decrease required resources when building kiln', async () => {
        civilization.addResource(new Resource(ResourceTypes.STONE, 20))
        const person1 = new PeopleBuilder()
          .withMonth(500)
          .withOccupation(OccupationTypes.WOODCUTTER)
          .withLifeCounter(12)
          .withId('ID1')
          .build()
        const person2 = new PeopleBuilder()
          .withMonth(500)
          .withOccupation(OccupationTypes.WOODCUTTER)
          .withLifeCounter(12)
          .withId('ID2')
          .build()
        civilization.addPeople(person1, person2)

        await civilization.passAMonth(world)

        const kiln = civilization.kiln

        expect(civilization.getResource(ResourceTypes.STONE)?.quantity).toBe(0)
        expect(kiln?.count).toBe(1)

        expect(person1.canWork()).toBeFalsy()
        expect(person2.canWork()).toBeFalsy()
      })
    })

    it('Should return all workers who can retire', () => {
      const person1 = new People({
        gender: Gender.FEMALE,
        lifeCounter: 12,
        month: 721,
      })
      const person2 = new People({
        gender: Gender.FEMALE,
        lifeCounter: 12,
        month: 721,
      })
      const person3 = new People({
        gender: Gender.MALE,
        lifeCounter: 12,
        month: 841,
      })
      const person4 = new People({
        gender: Gender.MALE,
        lifeCounter: 12,
        month: 100,
      })

      person1.setOccupation(OccupationTypes.WOODCUTTER)
      person2.setOccupation(OccupationTypes.FARMER)
      person3.setOccupation(OccupationTypes.FARMER)
      person4.setOccupation(OccupationTypes.WOODCUTTER)

      civilization.addPeople(person1, person2, person3, person4)

      const people = civilization.getWorkersWhoCanRetire()

      expect(people.length).toBe(2)
    })

    it('Should change occupation of people who can retire', async () => {
      civilization.name = 'retirePeople'
      const person1 = new People({
        gender: Gender.FEMALE,
        lifeCounter: 12,
        month: 721,
      })
      const person2 = new People({
        gender: Gender.FEMALE,
        lifeCounter: 12,
        month: 721,
      })
      const person3 = new People({
        gender: Gender.MALE,
        lifeCounter: 12,
        month: 841,
      })
      const person4 = new People({
        gender: Gender.MALE,
        lifeCounter: 12,
        month: 100,
      })

      person1.setOccupation(OccupationTypes.WOODCUTTER)
      person2.setOccupation(OccupationTypes.FARMER)
      person3.setOccupation(OccupationTypes.FARMER)
      person4.setOccupation(OccupationTypes.WOODCUTTER)

      civilization.addPeople(person1, person2, person3, person4)
      await civilization.passAMonth(world)

      const retired = civilization.getPeopleWithOccupation(
        OccupationTypes.RETIRED,
      )
      expect(civilization.people.length).toBe(4)
      expect(retired.length).toBe(2)
    })

    it('should remove all dead people', async () => {
      civilization.name = 'removeDead'
      isWithinChance.mockReturnValue(true)

      const person1 = new People({
        gender: Gender.FEMALE,
        lifeCounter: 0,
        month: 0,
      })
      const person2 = new People({
        gender: Gender.MALE,
        lifeCounter: 0,
        month: 0,
      })
      const person3 = new People({
        gender: Gender.MALE,
        lifeCounter: 12,
        month: LIFE_EXPECTANCY * 12 + 3,
      })

      civilization.addPeople(person2, person1, person3)
      await civilization.passAMonth(world)

      expect(civilization.people).toStrictEqual([])
    })

    it('should remove all dead people except the old ones who are defying death', async () => {
      civilization.name = 'defyingDeath'
      isWithinChance.mockReturnValue(false)

      const person1 = new People({
        gender: Gender.FEMALE,
        lifeCounter: 12,
        month: LIFE_EXPECTANCY * 12 + 10,
      })
      const person2 = new People({
        gender: Gender.MALE,
        lifeCounter: 0,
        month: 0,
      })
      const person3 = new People({
        gender: Gender.MALE,
        lifeCounter: 12,
        month: LIFE_EXPECTANCY * 12 + 3,
      })

      civilization.addPeople(person2, person1, person3)
      await civilization.passAMonth(world)

      expect(civilization.people).toStrictEqual([person1, person3])
    })

    it('should create new born', async () => {
      civilization.name = 'createNewBorn'
      const child = new PeopleBuilder()
        .withGender(Gender.MALE)
        .withOccupation(OccupationTypes.CARPENTER)
        .build()
      const person1 = new PeopleBuilder()
        .withGender(Gender.FEMALE)
        .withLifeCounter(12)
        .withMonth(240)
        .withOccupation(OccupationTypes.FARMER)
        .withChild(child)
        .withPregnancyMonthsLeft(0)
        .build()

      const decreaseSpy = jest.spyOn(person1, 'giveBirth')

      civilization.addPeople(person1)
      await civilization.passAMonth(world)

      expect(person1.canConceive()).toBe(false)
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
          .withLifeCounter(12)
          .withMonth(240)
          .withOccupation(OccupationTypes.FARMER)
          .withId('p1')
          .withLineage({ mother: { id: 'nope' }, father: { id: 'nope' } })
          .build()
        const person2 = new PeopleBuilder()
          .withGender(Gender.MALE)
          .withLifeCounter(12)
          .withMonth(240)
          .withOccupation(OccupationTypes.FARMER)
          .withId('p2')
          .withLineage({ mother: { id: 'mother' }, father: { id: 'father' } })
          .build()

        civilization.addPeople(person1, person2)
        civilization.addBuilding(new House(1))
        civilization.addResource(new Resource(ResourceTypes.RAW_FOOD, 100))
        await civilization.passAMonth(world)
        const child = person1.child

        expect(person1.lifeCounter).toBe(6)
        expect(person2.lifeCounter).toBe(6)
        expect(child).toBeDefined()
        expect(child?.lineage).toStrictEqual({
          mother: {
            id: person1.id,
            lineage: { father: { id: 'nope' }, mother: { id: 'nope' } },
          },
          father: {
            id: person2.id,
            lineage: { mother: { id: 'mother' }, father: { id: 'father' } },
          },
        })
        expect(child?.work).toBeDefined()
        expect(child!.work!.occupationType).toBe(OccupationTypes.CHILD)
        expect(child?.gender).toBeDefined()
        expect(
          [Gender.FEMALE, Gender.MALE].includes(child!.gender),
        ).toBeTruthy()
      })

      it('mother has no lineage', async () => {
        civilization.name = 'setPregnantNoLineageForMother'

        isWithinChance.mockReturnValue(true)
        const person1 = new PeopleBuilder()
          .withGender(Gender.FEMALE)
          .withLifeCounter(12)
          .withMonth(240)
          .withOccupation(OccupationTypes.FARMER)
          .withId('p1')
          .build()
        const person2 = new PeopleBuilder()
          .withGender(Gender.MALE)
          .withLifeCounter(12)
          .withMonth(240)

          .withOccupation(OccupationTypes.FARMER)
          .withId('p2')
          .withLineage({ mother: { id: 'mother' }, father: { id: 'father' } })
          .build()

        civilization.addPeople(person1, person2)
        civilization.addBuilding(new House(1))
        civilization.addResource(new Resource(ResourceTypes.RAW_FOOD, 100))
        await civilization.passAMonth(world)
        const child = person1.child

        expect(person1.lifeCounter).toBe(6)
        expect(person2.lifeCounter).toBe(6)
        expect(child).toBeDefined()
        expect(child?.lineage).toStrictEqual({
          mother: { id: person1.id },
          father: {
            id: person2.id,
            lineage: { mother: { id: 'mother' }, father: { id: 'father' } },
          },
        })
        expect(child?.work).toBeDefined()
        expect(child?.gender).toBeDefined()
        expect(
          [Gender.FEMALE, Gender.MALE].includes(child!.gender),
        ).toBeTruthy()
      })

      it('father has no lineage', async () => {
        civilization.name = 'setPregnantNoLineageForFather'

        isWithinChance.mockReturnValue(true)
        const person1 = new PeopleBuilder()
          .withGender(Gender.FEMALE)
          .withLifeCounter(12)
          .withMonth(240)
          .withOccupation(OccupationTypes.FARMER)
          .withId('p1')
          .withLineage({ mother: { id: 'nope' }, father: { id: 'nope' } })
          .build()
        const person2 = new PeopleBuilder()
          .withGender(Gender.MALE)
          .withLifeCounter(12)
          .withMonth(240)

          .withOccupation(OccupationTypes.FARMER)
          .withId('p2')
          .build()

        civilization.addPeople(person1, person2)
        civilization.addBuilding(new House(1))
        civilization.addResource(new Resource(ResourceTypes.RAW_FOOD, 100))
        await civilization.passAMonth(world)
        const child = person1.child

        expect(person1.lifeCounter).toBe(6)
        expect(person2.lifeCounter).toBe(6)
        expect(child).toBeDefined()
        expect(child?.lineage).toStrictEqual({
          mother: {
            id: person1.id,
            lineage: { father: { id: 'nope' }, mother: { id: 'nope' } },
          },
          father: { id: person2.id },
        })
        expect(child?.work).toBeDefined()
        expect(child?.gender).toBeDefined()
        expect(
          [Gender.FEMALE, Gender.MALE].includes(child!.gender),
        ).toBeTruthy()
      })
    })

    describe('resource production', () => {
      it('should use wood to make planks', async () => {
        const person1 = new PeopleBuilder()
          .withGender(Gender.FEMALE)
          .withLifeCounter(12)
          .withMonth(240)
          .withOccupation(OccupationTypes.CARPENTER)
          .withId('p1')
          .withLineage({ mother: { id: 'nope' }, father: { id: 'nope' } })
          .build()

        const person2 = new PeopleBuilder()
          .withGender(Gender.FEMALE)
          .withLifeCounter(12)
          .withMonth(240)
          .withOccupation(OccupationTypes.CARPENTER)
          .withId('p2')
          .withLineage({ mother: { id: 'nope' }, father: { id: 'nope' } })
          .build()

        civilization.addPeople(person1, person2)
        civilization.addBuilding(new House(1), new Sawmill(1))
        civilization.addResource(new Resource(ResourceTypes.RAW_FOOD, 100))
        civilization.addResource(new Resource(ResourceTypes.WOOD, 100))
        await civilization.passAMonth(world)

        expect(civilization.getResource(ResourceTypes.PLANK).quantity).toBe(5)
        expect(civilization.getResource(ResourceTypes.WOOD).quantity).toBe(99)
      })

      it('should use wood to make charcoal', async () => {
        const person1 = new PeopleBuilder()
          .withGender(Gender.FEMALE)
          .withLifeCounter(12)
          .withMonth(240)
          .withOccupation(OccupationTypes.CHARCOAL_BURNER)
          .withId('p1')
          .withLineage({ mother: { id: 'nope' }, father: { id: 'nope' } })
          .build()

        const person2 = new PeopleBuilder()
          .withGender(Gender.FEMALE)
          .withLifeCounter(12)
          .withMonth(240)
          .withOccupation(OccupationTypes.CHARCOAL_BURNER)
          .withId('p2')
          .withLineage({ mother: { id: 'nope' }, father: { id: 'nope' } })
          .build()

        civilization.addPeople(person1, person2)
        civilization.addBuilding(new House(1), new Kiln(1))
        civilization.addResource(new Resource(ResourceTypes.RAW_FOOD, 100))
        civilization.addResource(new Resource(ResourceTypes.WOOD, 100))
        await civilization.passAMonth(world)

        expect(civilization.getResource(ResourceTypes.CHARCOAL).quantity).toBe(
          10,
        )
        expect(civilization.getResource(ResourceTypes.WOOD).quantity).toBe(95)
      })
    })

    it('should set mother pregnant with a female wood cutter child', async () => {
      civilization.name = 'setPregnantWithFemaleWoodCutter'
      mockMath.random = () => 0
      global.Math = mockMath
      isWithinChance.mockReturnValue(true)
      const person1 = new PeopleBuilder()
        .withGender(Gender.FEMALE)
        .withLifeCounter(12)
        .withMonth(240)
        .withOccupation(OccupationTypes.FARMER)
        .withId('p1')
        .withLineage({ mother: { id: 'nope' }, father: { id: 'nope' } })
        .build()
      const person2 = new PeopleBuilder()
        .withGender(Gender.MALE)
        .withLifeCounter(12)
        .withMonth(240)
        .withOccupation(OccupationTypes.FARMER)
        .withId('p2')
        .withLineage({ mother: { id: 'mother' }, father: { id: 'father' } })
        .build()

      civilization.addPeople(person1, person2)
      civilization.addBuilding(new House(1))
      civilization.addResource(new Resource(ResourceTypes.RAW_FOOD, 100))
      await civilization.passAMonth(world)
      const child = person1.child

      expect(person1.lifeCounter).toBe(6)
      expect(person2.lifeCounter).toBe(6)
      expect(child).toBeDefined()
      expect(child?.lineage).toStrictEqual({
        mother: {
          id: person1.id,
          lineage: { father: { id: 'nope' }, mother: { id: 'nope' } },
        },
        father: {
          id: person2.id,
          lineage: { mother: { id: 'mother' }, father: { id: 'father' } },
        },
      })
      expect(child?.work).toBeDefined()
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
        .withLifeCounter(12)
        .withMonth(240)
        .withOccupation(OccupationTypes.FARMER)
        .withId('p1')
        .withLineage({ mother: { id: 'nope' }, father: { id: 'nope' } })
        .build()
      const person2 = new PeopleBuilder()
        .withGender(Gender.MALE)
        .withLifeCounter(12)
        .withMonth(240)
        .withOccupation(OccupationTypes.FARMER)
        .withId('p2')
        .withLineage({ mother: { id: 'mother' }, father: { id: 'father' } })
        .build()

      civilization.addPeople(person1, person2)
      civilization.addBuilding(new House(1))
      civilization.addResource(new Resource(ResourceTypes.RAW_FOOD, 100))
      await civilization.passAMonth(world)
      const child = person1.child

      expect(person1.lifeCounter).toBe(6)
      expect(person2.lifeCounter).toBe(6)
      expect(child).toBeDefined()
      expect(child?.lineage).toStrictEqual({
        mother: {
          id: person1.id,
          lineage: { father: { id: 'nope' }, mother: { id: 'nope' } },
        },
        father: {
          id: person2.id,
          lineage: { mother: { id: 'mother' }, father: { id: 'father' } },
        },
      })
      expect(child?.work).toBeDefined()
      expect(child?.gender).toBeDefined()
      expect(child!.gender).toBe(Gender.MALE)
    })

    it('should not set mother pregnant', async () => {
      civilization.name = 'notSetPregnant'
      isWithinChance.mockReturnValue(false)
      const person1 = new PeopleBuilder()
        .withGender(Gender.FEMALE)
        .withLifeCounter(12)
        .withMonth(240)
        .withOccupation(OccupationTypes.FARMER)
        .withId('p1')
        .withLineage({ mother: { id: 'nope' }, father: { id: 'nope' } })
        .build()
      const person2 = new PeopleBuilder()
        .withGender(Gender.MALE)
        .withLifeCounter(12)
        .withMonth(240)
        .withOccupation(OccupationTypes.FARMER)
        .withId('p2')
        .withLineage({ mother: { id: 'mother' }, father: { id: 'father' } })
        .build()

      civilization.addPeople(person1, person2)
      civilization.addBuilding(new House(1))
      civilization.addResource(new Resource(ResourceTypes.RAW_FOOD, 100))
      await civilization.passAMonth(world)
      const child = person1.child

      expect(person1.lifeCounter).toBe(12)
      expect(person2.lifeCounter).toBe(12)
      expect(child).toBeFalsy()
    })

    it('should not set mother pregnant because other male is her brother', async () => {
      civilization.name = 'notSetPregnantBrotherCase'

      isWithinChance.mockReturnValue(true)
      const person1 = new PeopleBuilder()
        .withGender(Gender.FEMALE)
        .withLifeCounter(12)
        .withMonth(240)
        .withOccupation(OccupationTypes.FARMER)
        .withId('p1')
        .withLineage({ mother: { id: 'mother' }, father: { id: 'nope' } })
        .build()
      const person2 = new PeopleBuilder()
        .withGender(Gender.MALE)
        .withLifeCounter(12)
        .withMonth(240)
        .withOccupation(OccupationTypes.FARMER)
        .withId('p2')
        .withLineage({ mother: { id: 'mother' }, father: { id: 'father' } })
        .build()

      civilization.addPeople(person1, person2)
      civilization.addBuilding(new House(1))
      civilization.addResource(new Resource(ResourceTypes.RAW_FOOD, 100))
      await civilization.passAMonth(world)
      const child = person1.child

      expect(person1.lifeCounter).toBe(12)
      expect(person2.lifeCounter).toBe(12)
      expect(child).toBeFalsy()
    })

    it('should not set mother pregnant because other male is her father', async () => {
      civilization.name = 'notSetPregnantUncleCase'

      isWithinChance.mockReturnValue(true)
      const person1 = new PeopleBuilder()
        .withGender(Gender.FEMALE)
        .withLifeCounter(12)
        .withMonth(240)
        .withOccupation(OccupationTypes.FARMER)
        .withId('p1')
        .withLineage({
          mother: {
            id: 'nope',
            lineage: { mother: { id: 'mother' }, father: { id: 'yep' } },
          },
          father: { id: 'fope' },
        })
        .build()
      const person2 = new PeopleBuilder()
        .withGender(Gender.MALE)
        .withLifeCounter(12)
        .withMonth(240)
        .withOccupation(OccupationTypes.FARMER)
        .withId('p2')
        .withLineage({ mother: { id: 'mother' }, father: { id: 'p1' } })
        .build()

      civilization.addPeople(person1, person2)
      civilization.addBuilding(new House(1))
      civilization.addResource(new Resource(ResourceTypes.RAW_FOOD, 100))
      await civilization.passAMonth(world)
      const child = person1.child

      expect(person1.lifeCounter).toBe(12)
      expect(person2.lifeCounter).toBe(12)
      expect(child).toBeFalsy()
    })

    describe('Resource consumption', () => {
      it('Should eat raw food', async () => {
        const person1 = new PeopleBuilder()
          .withGender(Gender.FEMALE)
          .withLifeCounter(12)
          .withMonth(240)
          .withOccupation(OccupationTypes.FARMER)
          .withId('p1')
          .build()
        const person2 = new PeopleBuilder()
          .withGender(Gender.MALE)
          .withLifeCounter(12)
          .withMonth(240)

          .withOccupation(OccupationTypes.FARMER)
          .withId('p2')
          .build()

        civilization.addPeople(person1, person2)
        civilization.addBuilding(new House(1))
        civilization.addResource(new Resource(ResourceTypes.RAW_FOOD, 100))
        await civilization.passAMonth(world)

        expect(civilization.getResource(ResourceTypes.RAW_FOOD).quantity).toBe(
          100 -
          civilization.people.reduce(
            (acc, person) =>
              EAT_FACTOR[person.work!.occupationType] * 2 + acc,
            0,
          ),
        )
      })

      it('Should eat cooked food', async () => {
        const person1 = new PeopleBuilder()
          .withGender(Gender.FEMALE)
          .withLifeCounter(10)
          .withMonth(240)
          .withOccupation(OccupationTypes.FARMER)
          .withId('p1')
          .build()
        const person2 = new PeopleBuilder()
          .withGender(Gender.MALE)
          .withLifeCounter(12)
          .withMonth(240)
          .withOccupation(OccupationTypes.FARMER)
          .withId('p2')
          .build()

        civilization.addPeople(person1, person2)
        civilization.addBuilding(new House(1))
        civilization.addResource(new Resource(ResourceTypes.COOKED_FOOD, 100))
        await civilization.passAMonth(world)

        expect(
          civilization.getResource(ResourceTypes.COOKED_FOOD).quantity,
        ).toBe(
          100 -
          civilization.people.reduce(
            (acc, person) => EAT_FACTOR[person.work!.occupationType] + acc,
            0,
          ),
        )
      })

      describe('wood consumption', () => {
        it('Should use wood in winter', async () => {
          const person1 = new PeopleBuilder()
            .withGender(Gender.FEMALE)
            .withLifeCounter(12)
            .withMonth(240)
            .withOccupation(OccupationTypes.FARMER)
            .withId('p1')
            .build()
          const person2 = new PeopleBuilder()
            .withGender(Gender.MALE)
            .withLifeCounter(12)
            .withMonth(240)
            .withOccupation(OccupationTypes.FARMER)
            .withId('p2')
            .build()

          world['month'] = 9

          civilization.addPeople(person1, person2)
          civilization.addBuilding(new House(1))
          civilization.addResource(new Resource(ResourceTypes.WOOD, 100))
          civilization.addResource(new Resource(ResourceTypes.RAW_FOOD, 100))
          await civilization.passAMonth(world)

          expect(civilization.getResource(ResourceTypes.WOOD).quantity).toBe(
            100 - 3 * civilization.people.length,
          )
        })

        it('Should use wood in automn', async () => {
          const person1 = new PeopleBuilder()
            .withGender(Gender.FEMALE)
            .withLifeCounter(12)
            .withMonth(240)
            .withOccupation(OccupationTypes.FARMER)
            .withId('p1')
            .build()
          const person2 = new PeopleBuilder()
            .withGender(Gender.MALE)
            .withLifeCounter(12)
            .withMonth(240)
            .withOccupation(OccupationTypes.FARMER)
            .withId('p2')
            .build()

          world['month'] = 6

          civilization.addPeople(person1, person2)
          civilization.addBuilding(new House(1))
          civilization.addResource(new Resource(ResourceTypes.WOOD, 100))
          civilization.addResource(new Resource(ResourceTypes.RAW_FOOD, 100))
          await civilization.passAMonth(world)

          expect(civilization.getResource(ResourceTypes.WOOD).quantity).toBe(
            100 - 2 * civilization.people.length,
          )
        })

        it('Should use charcoal in winter', async () => {
          civilization.name = 'charcoal-winter'
          const person1 = new PeopleBuilder()
            .withGender(Gender.FEMALE)
            .withLifeCounter(12)
            .withMonth(240)
            .withOccupation(OccupationTypes.FARMER)
            .withId('p1')
            .withLineage({
              mother: {
                id: 'nope',
                lineage: { mother: { id: 'mother' }, father: { id: 'yep' } },
              },
              father: { id: 'nope' },
            })
            .build()
          const person2 = new PeopleBuilder()
            .withGender(Gender.MALE)
            .withLifeCounter(12)
            .withMonth(240)
            .withOccupation(OccupationTypes.FARMER)
            .withId('p2')
            .withLineage({ mother: { id: 'mother' }, father: { id: 'father' } })
            .build()

          world['month'] = 9

          civilization.addPeople(person1, person2)
          civilization.addBuilding(new House(1))
          civilization.addResource(new Resource(ResourceTypes.CHARCOAL, 100))
          civilization.addResource(new Resource(ResourceTypes.WOOD, 100))
          civilization.addResource(new Resource(ResourceTypes.RAW_FOOD, 100))
          await civilization.passAMonth(world)

          expect(
            civilization.getResource(ResourceTypes.CHARCOAL).quantity,
          ).toBe(99)
          expect(civilization.getResource(ResourceTypes.WOOD).quantity).toBe(
            100,
          )
        })

        it('Should use 10 charcoal in winter', async () => {
          civilization.name = '10-winter'
          const people = Array.from({ length: 100 }, (_, i) =>
            new PeopleBuilder()
              .withGender(Gender.FEMALE)
              .withLifeCounter(12)
              .withMonth(240)
              .withOccupation(OccupationTypes.FARMER)
              .withId(`${i}`)
              .build(),
          )

          world['month'] = 9

          civilization.addPeople(...people)
          civilization.addBuilding(new House(100))
          civilization.addResource(new Resource(ResourceTypes.CHARCOAL, 100))
          civilization.addResource(new Resource(ResourceTypes.WOOD, 100))
          civilization.addResource(new Resource(ResourceTypes.RAW_FOOD, 100))
          await civilization.passAMonth(world)

          expect(
            civilization.getResource(ResourceTypes.CHARCOAL).quantity,
          ).toBe(90)
          expect(civilization.getResource(ResourceTypes.WOOD).quantity).toBe(
            100,
          )
        })

        it('Should use 11 charcoal in winter', async () => {
          civilization.name = '11-winter'
          const people = Array.from({ length: 101 }, (_, i) =>
            new PeopleBuilder()
              .withGender(Gender.FEMALE)
              .withLifeCounter(12)
              .withMonth(240)
              .withId(`${i}`)
              .withOccupation(OccupationTypes.FARMER)
              .build(),
          )

          world['month'] = 9

          civilization.addPeople(...people)
          civilization.addBuilding(new House(100))
          civilization.addResource(new Resource(ResourceTypes.CHARCOAL, 100))
          civilization.addResource(new Resource(ResourceTypes.WOOD, 100))
          civilization.addResource(new Resource(ResourceTypes.RAW_FOOD, 100))
          await civilization.passAMonth(world)

          expect(
            civilization.getResource(ResourceTypes.CHARCOAL).quantity,
          ).toBe(89)
          expect(civilization.getResource(ResourceTypes.WOOD).quantity).toBe(
            100,
          )
        })

        it('Should use charcoal in automn', async () => {
          civilization.name = 'charcoal-automn'
          const person1 = new PeopleBuilder()
            .withGender(Gender.FEMALE)
            .withLifeCounter(12)
            .withMonth(240)
            .withOccupation(OccupationTypes.FARMER)
            .withId('p1')
            .withLineage({
              mother: {
                id: 'nope',
                lineage: { mother: { id: 'mother' }, father: { id: 'yep' } },
              },
              father: { id: 'nope' },
            })
            .build()
          const person2 = new PeopleBuilder()
            .withGender(Gender.MALE)
            .withLifeCounter(12)
            .withMonth(240)
            .withOccupation(OccupationTypes.FARMER)
            .withId('p2')
            .withLineage({ mother: { id: 'mother' }, father: { id: 'father' } })
            .build()

          world['month'] = 6

          civilization.addPeople(person1, person2)
          civilization.addBuilding(new House(1))
          civilization.addResource(new Resource(ResourceTypes.CHARCOAL, 100))
          civilization.addResource(new Resource(ResourceTypes.WOOD, 100))
          civilization.addResource(new Resource(ResourceTypes.RAW_FOOD, 100))
          await civilization.passAMonth(world)

          expect(
            civilization.getResource(ResourceTypes.CHARCOAL).quantity,
          ).toBe(99)
          expect(civilization.getResource(ResourceTypes.WOOD).quantity).toBe(
            100,
          )
        })
      })
    })
  })
})
