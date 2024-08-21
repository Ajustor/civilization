import { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { CivilizationEntity, civilizationTable } from '../../../db/schema/civilizations'
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

  private async buildCivilization(civilization: CivilizationEntity): Promise<Civilization> {
    const builder = new CivilizationBuilder()
    const civilizationResources = await this.client.select().from(civilizationsResourcesTable).where(eq(civilizationsResourcesTable.civilizationId, civilization.id))

    for (const civilizationResource of civilizationResources) {
      const resource = new Resource(civilizationResource.resourceType, civilizationResource.quantity)
      builder.addResource(resource)
    }

    for (const house of civilization.buildings.filter((building) => building.type === BuildingTypes.HOUSE)) {
      if (house.capacity) {
        const civilizationHouse = new House(house.capacity)

        // for (const resident of house.residents ?? []) {
        //   const citizen = new Citizen(resident.name, resident.age, resident.lifeCounter)
        //   if (resident.profession) {
        //     citizen.setProfession(resident.profession)
        //   }
        //   civilizationHouse.addResident(citizen)
        // }

        builder.addHouse(civilizationHouse)
      }
    }

    builder.addCitizen(...civilization.citizens.map(({ name, month, lifeCounter, profession, buildingYearsLeft, isBuilding }) => {
      const citizen = new Citizen(name, month, lifeCounter)
      if (profession) {
        citizen.setProfession(profession)
      }
      citizen.isBuilding = isBuilding
      citizen.buildingMonthsLeft = buildingYearsLeft
      return citizen
    }))

    return builder.withName(civilization.name).build()
  }

  private async buildCivilizations(...civilizations: CivilizationEntity[]): Promise<Civilization[]> {
    return Promise.all(civilizations.map((civilization) => this.buildCivilization(civilization)))
  }

  async getAllByWorldId(worldId: string): Promise<Civilization[]> {
    const civilizationIds = await this.client.select({
      civilizationId: civilizationsWorldTable.civilizationId
    })
      .from(civilizationsWorldTable)
      .where(eq(civilizationsWorldTable.worldId, worldId))



    return Promise.all(civilizationIds.map(({ civilizationId }) => this.getById(civilizationId)))
  }

  async getById(civilizationId: string): Promise<Civilization> {
    const [civilization] = await this.client
      .select()
      .from(civilizationTable)
      .where(eq(civilizationTable.id, civilizationId))

    return this.buildCivilization(civilization)
  }

  async getAll(): Promise<Civilization[]> {
    const civilizations = await this.client
      .select()
      .from(civilizationTable)

    return this.buildCivilizations(...civilizations)
  }

  async create(userId: string, civilization: Civilization) {
    const [createdCivilization] = await this.client.insert(civilizationTable).values({
      citizens: civilization.getCitizens().map(({ month, name, profession, lifeCounter, isBuilding, buildingMonthsLeft: buildingYearsLeft }) => ({ month, name, profession: profession?.professionType, lifeCounter, isBuilding, buildingYearsLeft })),
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