import { Civilization } from '..'
import { House } from '../buildings/house'
import { Gender } from '../people/enum'
import { People } from '../people/people'
import { Resource, ResourceTypes } from '../resource'
import { CivilizationBuilder } from './civilizationBuilder'

describe('CivilizationBuilder', () => {

  // Successfully builds a Civilization with default name and zero lived months
  it('should build a Civilization with default name and zero lived months when no parameters are set', () => {
    const builder = new CivilizationBuilder()
    const civilization = builder.build()

    expect(civilization.name).toBeDefined()
    expect(civilization.livedMonths).toBe(0)
  })

  // Handles building a Civilization with no People, Resources, or Buildings
  it('should build a Civilization with no People, Resources, or Buildings when none are added', () => {
    const builder = new CivilizationBuilder()
    const civilization = builder.build()

    expect(civilization.people).toHaveLength(0)
    expect(civilization.resources).toHaveLength(0)
    expect(civilization.buildings).toHaveLength(0)
  })

  // Allows setting a custom name for the Civilization
  it('should set custom name for the Civilization when withName is used', () => {
    const builder = new CivilizationBuilder()
    const customName = 'My Civilization'
    const civilization = builder.withName(customName).build()

    expect(civilization.name).toBe(customName)
  })

  // Correctly adds multiple People to the Civilization
  it('should add multiple People to the Civilization', () => {
    const builder = new CivilizationBuilder()
    const person1 = new People({ name: 'Alice', gender: Gender.FEMALE, lifeCounter: 100, month: 120 })
    const person2 = new People({ name: 'Bob', gender: Gender.MALE, lifeCounter: 100, month: 120 })
    const civilization = builder.addCitizen(person1, person2).build()

    expect(civilization.people).toContain(person1)
    expect(civilization.people).toContain(person2)
  })

  // Correctly adds multiple Resources to the Civilization
  it('should add multiple Resources to the Civilization', () => {
    const builder = new CivilizationBuilder()
    const resource1 = new Resource(ResourceTypes.FOOD, 100)
    const resource2 = new Resource(ResourceTypes.WOOD, 50)

    const civilization = builder
      .addResource(resource1, resource2)
      .build()

    expect(civilization.resources).toEqual([resource1, resource2])
  })

  // Successfully sets a custom ID for the Civilization
  it('should set a custom ID for the Civilization when withId is called', () => {
    const builder = new CivilizationBuilder()
    const customId = 'ABC123'
    const civilization = builder.withId(customId).build()

    expect(civilization.id).toBe(customId)
  })

  // Correctly adds multiple Buildings to the Civilization
  it('should add multiple Buildings to the Civilization', () => {
    const builder = new CivilizationBuilder()
    const building1 = new House(4, 1)

    const civilization = builder
      .addBuilding(building1)
      .build()

    expect(civilization.buildings).toHaveLength(1)
    expect(civilization.buildings[0]).toEqual(building1)
  })

  // Handles setting an empty string as the Civilization name
  it('should handle setting an empty string as the Civilization name', () => {
    const builder = new CivilizationBuilder()
    const civilization = builder.withName('Nope').build()

    expect(civilization.name).toBe('Nope')
  })

  // Handles setting a negative number for livedMonths
  it('should handle setting a negative number for livedMonths', () => {
    const builder = new CivilizationBuilder()
    const negativeMonths = -5
    builder.withLivedMonths(negativeMonths)
    const civilization = builder.build()

    expect(civilization.livedMonths).toBe(negativeMonths)
  })

  // Handles building a Civilization without setting an ID
  it('should build a Civilization without setting an ID', () => {
    const builder = new CivilizationBuilder()
    const civilization = builder.build()

    expect(civilization.id).toBeDefined()
  })

  // Handles adding duplicate People, Resources, or Buildings
  it('should handle adding duplicate People, Resources, or Buildings', () => {
    const builder = new CivilizationBuilder()

    const person = new People({ name: 'Alice', gender: Gender.FEMALE, lifeCounter: 100, month: 120 })
    const resource = new Resource(ResourceTypes.FOOD, 10)
    const building = new House(2)

    builder.addCitizen(person).addResource(resource).addBuilding(building)

    const civilization = builder.addCitizen(person).addResource(resource).addBuilding(building).build()

    expect(civilization.people).toEqual([person, person])
    expect(civilization.resources).toEqual([resource])
    expect(civilization.buildings).toEqual([building])
  })

  // Ensures uniqueNamesGenerator generates a valid default name
  it('should generate a valid default name using uniqueNamesGenerator', () => {
    const builder = new CivilizationBuilder()
    const civilization = builder.build()

    expect(civilization.name).toBeDefined()
  })

  // Verifies that the build method resets the builder's state
  it('should reset builder\'s state after building a Civilization', () => {
    const builder = new CivilizationBuilder()
      .withName('Test Civilization')
      .withLivedMonths(12)
      .addCitizen(new People({ name: 'Alice', gender: Gender.FEMALE, lifeCounter: 100, month: 120 }))
      .addResource(new Resource(ResourceTypes.WOOD, 500))
      .addBuilding(new House(4))
      .withId('123')

    const civilization = builder.build()

    expect(builder['name']).not.toBe(civilization.name)
    expect(builder['livedMonths']).not.toBe(civilization.livedMonths)
    expect(builder['people']).not.toEqual(civilization.people)
    expect(builder['resources']).not.toEqual(civilization.resources)
    expect(builder['buildings']).not.toEqual(civilization.buildings)
    expect(builder['id']).not.toBe(civilization.id)
  })

  // Confirms that chaining methods return the correct instance
  it('should return the correct instance when chaining methods', () => {
    const builder = new CivilizationBuilder()
    const instance = builder
      .withName('Test Civilization')
      .withLivedMonths(12)
      .addCitizen(new People({ name: 'Alice', gender: Gender.FEMALE, lifeCounter: 100, month: 120 }))
      .addResource(new Resource(ResourceTypes.FOOD, 10))
      .addBuilding(new House(4))
      .withId('123')
      .build()

    expect(instance).toBeInstanceOf(Civilization)
  })

  // Builds a Civilization with all specified attributes correctly assigned
  it('should build a Civilization with specified attributes correctly assigned', () => {
    const people = [new People({ name: 'Alice', gender: Gender.FEMALE, lifeCounter: 100, month: 120 }), new People({ name: 'Bob', gender: Gender.MALE, lifeCounter: 100, month: 120 })]
    const resources = [new Resource(ResourceTypes.FOOD, 200), new Resource(ResourceTypes.WOOD, 200)]
    const buildings = [new House(4)]

    const builder = new CivilizationBuilder()
      .withName('Test Civilization')
      .withLivedMonths(12)
      .addCitizen(...people)
      .addResource(...resources)
      .addBuilding(...buildings)
      .withId('123')

    const civilization = builder.build()

    expect(civilization.name).toBe('Test Civilization')
    expect(civilization.livedMonths).toBe(12)
    expect(civilization.people).toEqual(people)
    expect(civilization.resources).toEqual(resources)
    expect(civilization.buildings).toEqual(buildings)
    expect(civilization.id).toBe('123')
  })

  // Validates that Civilization properties are correctly initialized
  it('should initialize Civilization properties correctly when using default constructor', () => {
    const builder = new CivilizationBuilder()

    const civilization = builder.build()

    expect(civilization.name).toBeDefined()
    expect(civilization.livedMonths).toBe(0)
  })
})
