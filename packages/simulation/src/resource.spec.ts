import { Resource, ResourceTypes } from './resource'

describe('Resource', () => {

  // Creating a Resource instance with valid type and quantity
  it('should create a Resource instance with valid type and quantity', () => {
    const resource = new Resource(ResourceTypes.FOOD, 100)
    expect(resource.type).toBe(ResourceTypes.FOOD)
    expect(resource.quantity).toBe(100)
  })

  // Decreasing the quantity of a Resource instance to exactly zero
  it('should decrease the quantity to zero when the decrease amount equals the current quantity', () => {
    const resource = new Resource(ResourceTypes.FOOD, 50)
    resource.decrease(50)
    expect(resource.quantity).toBe(0)
  })

  // Retrieving the type of a Resource instance
  it('should retrieve the correct type of a Resource instance', () => {
    const resource = new Resource(ResourceTypes.WOOD, 50)
    expect(resource.type).toBe(ResourceTypes.WOOD)
  })

  // Retrieving the quantity of a Resource instance
  it('should retrieve the quantity when called', () => {
    const resource = new Resource(ResourceTypes.WOOD, 50)
    expect(resource.quantity).toBe(50)
  })

  // Increasing the quantity of a Resource instance
  it('should increase quantity when positive value is provided', () => {
    const resource = new Resource(ResourceTypes.WOOD, 50)
    resource.increase(30)
    expect(resource.quantity).toBe(80)
  })

  // Decreasing the quantity of a Resource instance without going below zero
  it('should decrease quantity without going below zero', () => {
    const resource = new Resource(ResourceTypes.WOOD, 50)
    resource.decrease(30)
    expect(resource.quantity).toBe(20)
    resource.decrease(25)
    expect(resource.quantity).toBe(0)
    resource.decrease(10)
    expect(resource.quantity).toBe(0)
  })

  // Formatting a Resource instance to ResourceType
  it('should format Resource instance to ResourceType', () => {
    const resource = new Resource(ResourceTypes.WOOD, 50)
    const formattedResource = resource.formatToType()
    expect(formattedResource).toEqual({ quantity: 50, type: ResourceTypes.WOOD })
  })

  // Creating a Resource instance with a negative quantity
  it('should create a Resource instance with negative quantity set to 0', () => {
    const resource = new Resource(ResourceTypes.FOOD, -50)
    expect(resource.type).toBe(ResourceTypes.FOOD)
    expect(resource.quantity).toBe(0)
  })

  // Increasing the quantity of a Resource instance by zero
  it('should not change the quantity when increasing by zero', () => {
    const resource = new Resource(ResourceTypes.WOOD, 50)
    const initialQuantity = resource.quantity
    resource.increase(0)
    expect(resource.quantity).toBe(initialQuantity)
  })

  // Decreasing the quantity of a Resource instance below zero
  it('should set quantity to zero when decreasing below zero', () => {
    const resource = new Resource(ResourceTypes.WOOD, 50)
    resource.decrease(60)
    expect(resource.quantity).toBe(0)
  })

  // Handling large numbers for quantity increase and decrease
  it('should handle large quantity increase without errors', () => {
    const resource = new Resource(ResourceTypes.WOOD, 1000000000000)
    resource.increase(500000000000)
    expect(resource.quantity).toBe(1500000000000)
  })

  // Verifying the formatToType method returns the correct structure
  it('should return correct structure when calling formatToType', () => {
    const resource = new Resource(ResourceTypes.WOOD, 50)
    const formattedResource = resource.formatToType()
    expect(formattedResource).toEqual({ quantity: 50, type: ResourceTypes.WOOD })
  })

  // Validating the constructor parameters for type safety
  it('should validate constructor parameters for type safety when creating a Resource instance', () => {
    const invalidResource = 'invalidType' as ResourceTypes
    const createResourceWithInvalidType = () => new Resource(invalidResource, 100)
    const createResourceWithInvalidQuantity = () => new Resource(ResourceTypes.FOOD, 'invalidQuantity' as unknown as number)

    expect(createResourceWithInvalidType).toThrow('Resource not implemented')
    expect(createResourceWithInvalidQuantity).toThrow('Quantity is not a number')
  })

  // Ensuring immutability of type property after instantiation
  it('should ensure immutability of type property', () => {
    const initialType = ResourceTypes.WOOD
    const resource = new Resource(initialType, 50)
    const typeBeforeMutation = resource.type
    resource.increase(20)
    const typeAfterMutation = resource.type
    expect(typeBeforeMutation).toBe(typeAfterMutation)
  })
})
