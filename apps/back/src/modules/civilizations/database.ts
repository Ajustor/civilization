import { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { CivilizationEntity, civilizationTable } from '../../../db/schema/civilizations'
import { Civilization } from '../../simulation/civilization'
import { CivilizationBuilder } from '../../simulation/builders/civilizationBuilder'
import { civilizationsResourcesTable } from '../../../db/schema/civilizationsResourcesTable'
import { eq } from 'drizzle-orm'
import { Resource } from '../../simulation/resource'
import { BuildingTypes } from '../../simulation/buildings/enum'
import { House } from '../../simulation/buildings/house'

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

      for (const house of civilization.buildings.filter((building) => building.getType() === BuildingTypes.HOUSE)) {
        if (house.capacity) {
          const civilizationHouse = new House(house.capacity)

          for (const resident of house.residents ?? []) {
            civilizationHouse.addResident(resident)
          }

          builder.addHouse(civilizationHouse)
        }
      }

      builder.addCitizen(...civilization.citizens)


      result.push(builder.build())
    }

    console.log('PLOP', result)


    return result
  }

  async create(civilization: CivilizationEntity) {
    await this.client.insert(civilizationTable).values(civilization)
  }
}