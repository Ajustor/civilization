import { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { civilizationTable } from '../../../db/schema/civilizations'
import { Civilization } from '../../simulation/civilization'
import { CivilizationBuilder } from '../../simulation/builders/civilizationBuilder'
import { civilizationsResourcesTable } from '../../../db/schema/civilizationsResourcesTable'
import { eq } from 'drizzle-orm'
import { Resource } from '../../simulation/resource'
import { BuildingTypes } from '../../simulation/buildings/enum'
import { House } from '../../simulation/buildings/house'
import { usersCivilizationTable } from '../../../db/schema/usersCivilizationsTable'
import { civilizationsWorldTable } from '../../../db/schema/civilizationsWorldsTable'
import { worldsTable } from '../../../db/schema/worldSchema'
import { Citizen } from '../../simulation/citizen/citizen'

export class CivilizationTable {
  constructor(private readonly client: BunSQLiteDatabase) {

  }

  async getAll(): Promise<Civilization[]> {
    const civilizations = await this.client
      .select()
      .from(civilizationTable)

    const result: Civilization[] = []

    for (const civilization of civilizations) {
      const builder = new CivilizationBuilder()
      const civilizationResources = await this.client.select().from(civilizationsResourcesTable).where(eq(civilizationsResourcesTable.civilizationId, civilization.id))

      for (const civilizationResource of civilizationResources) {
        const resource = new Resource(civilizationResource.resourceType, civilizationResource.quantity)
        builder.addResource(resource)
      }

      for (const house of civilization.buildings.filter((building) => building.type === BuildingTypes.HOUSE)) {
        if (house.capacity) {
          const civilizationHouse = new House(house.capacity)

          for (const resident of house.residents ?? []) {
            const citizen = new Citizen(resident.name, resident.age, resident.lifeCounter)
            if (resident.profession) {
              citizen.setProfession(resident.profession)
            }
            civilizationHouse.addResident(citizen)
          }

          builder.addHouse(civilizationHouse)
        }
      }

      builder.addCitizen(...civilization.citizens.map(({ name, age, lifeCounter, profession }) => {
        const citizen = new Citizen(name, age, lifeCounter)
        if (profession) {
          citizen.setProfession(profession)
        }
        return citizen
      }))


      result.push(builder.build())
    }

    return result
  }

  async create(userId: string, civilization: Civilization) {
    const [createdCivilization] = await this.client.insert(civilizationTable).values({
      citizens: civilization.getCitizens().map(({ age, name, profession, lifeCounter }) => ({ age, name, profession: profession?.professionType, lifeCounter })),
      // buildings: civilization.getBuildings(),
      name: civilization.name
    }).returning({ id: civilizationTable.id })

    await this.client.insert(usersCivilizationTable).values({
      civilizationId: createdCivilization.id,
      userId
    })

    for (const civilizationResource of civilization.getResources()) {
      await this.client.insert(civilizationsResourcesTable).values({
        resourceType: civilizationResource.getType(),
        quantity: civilizationResource.getQuantity(),
        civilizationId: createdCivilization.id
      })
    }

    const [world] = await this.client.select().from(worldsTable)

    await this.client.insert(civilizationsWorldTable).values({
      civilizationId: createdCivilization.id,
      worldId: world.id,
    })
  }
}