import { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { CivilizationEntity, civilizationTable } from '../../../db/schema/civilizations'
import { civilizationsResourcesTable } from '../../../db/schema/civilizationsResourcesTable'
import { and, count, eq, inArray } from 'drizzle-orm'
import { usersCivilizationTable } from '../../../db/schema/usersCivilizationsTable'
import { civilizationsWorldTable } from '../../../db/schema/civilizationsWorldsTable'
import { worldsTable } from '../../../db/schema/worldSchema'
import { Civilization, CivilizationBuilder, Resource, BuildingTypes, House, Citizen } from '@ajustor/simulation'

export async function buildCivilization(dbClient: BunSQLiteDatabase, civilization: CivilizationEntity): Promise<Civilization> {
  const builder = new CivilizationBuilder()
  const civilizationResources = await dbClient.select().from(civilizationsResourcesTable).where(eq(civilizationsResourcesTable.civilizationId, civilization.id))

  for (const civilizationResource of civilizationResources) {
    const resource = new Resource(civilizationResource.resourceType, civilizationResource.quantity)
    builder.addResource(resource)
  }

  for (const house of civilization.buildings.filter((building) => building.type === BuildingTypes.HOUSE)) {
    if (house.capacity) {
      const civilizationHouse = new House(house.capacity)

      builder.addHouse(civilizationHouse)
    }
  }

  builder.addCitizen(...civilization.citizens.map(({ name, month, lifeCounter, profession, buildingMonthsLeft: buildingYearsLeft, isBuilding }) => {
    const citizen = new Citizen(name, month, lifeCounter)
    if (profession) {
      citizen.setProfession(profession)
    }
    citizen.isBuilding = isBuilding
    citizen.buildingMonthsLeft = buildingYearsLeft
    return citizen
  }))

  return builder.withId(civilization.id).withLivedMonths(civilization.livedMonths).withName(civilization.name).build()
}

export class CivilizationTable {
  constructor(private readonly client: BunSQLiteDatabase) {

  }

  private async buildCivilizations(...civilizations: CivilizationEntity[]): Promise<Civilization[]> {
    return Promise.all(civilizations.map((civilization) => buildCivilization(this.client, civilization)))
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

    return buildCivilization(this.client, civilization)
  }

  async getAll(): Promise<Civilization[]> {
    const civilizations = await this.client
      .select()
      .from(civilizationTable)

    return this.buildCivilizations(...civilizations)
  }

  async getByUserId(userId: string): Promise<Civilization[]> {
    const userCivilizationsIds = await this.client
      .select()
      .from(usersCivilizationTable)
      .where(
        eq(usersCivilizationTable.userId, userId),
      )

    const civilizationsIds = userCivilizationsIds.reduce<string[]>((ids, { civilizationId }) => {
      if (civilizationId) {
        return [...ids, civilizationId]
      }
      return ids
    }, [])


    const civilizations = await this.client
      .select()
      .from(civilizationTable)
      .where(inArray(civilizationTable.id, civilizationsIds))

    return this.buildCivilizations(...civilizations)
  }

  async getByUserAndCivilizationId(userId: string, civilizationId: string): Promise<Civilization> {
    const [{ value }] = await this.client
      .select({ value: count(usersCivilizationTable.id) })
      .from(usersCivilizationTable)
      .where(
        and(
          eq(usersCivilizationTable.userId, userId),
          eq(usersCivilizationTable.civilizationId, civilizationId),
        )
      )

    if (!value) {
      throw new Error(`No civilization found for this user with id ${civilizationId}`)
    }

    const [civilization] = await this.client
      .select()
      .from(civilizationTable)
      .where(eq(civilizationTable.id, civilizationId))

    return buildCivilization(this.client, civilization)
  }


  async create(userId: string, civilization: Civilization) {
    const [createdCivilization] = await this.client.insert(civilizationTable).values({
      citizens: civilization.citizens.map((citizen) => citizen.formatToEntity()),
      buildings: civilization.buildings.map((building) => building.formatToType()),
      name: civilization.name
    }).returning({ id: civilizationTable.id })

    await this.client.insert(usersCivilizationTable).values({
      civilizationId: createdCivilization.id,
      userId
    })

    for (const civilizationResource of civilization.resources) {
      await this.client.insert(civilizationsResourcesTable).values({
        resourceType: civilizationResource.type,
        quantity: civilizationResource.quantity,
        civilizationId: createdCivilization.id
      })
    }

    const [world] = await this.client.select().from(worldsTable)

    await this.client.insert(civilizationsWorldTable).values({
      civilizationId: createdCivilization.id,
      worldId: world.id,
    })
  }

  async saveAll(civilizations: Civilization[]) {
    for (const civilization of civilizations) {
      await this.client.update(civilizationTable).set({
        livedMonths: civilization.livedMonths,
        citizens: civilization.citizens.map((citizen) => citizen.formatToEntity()),
        buildings: civilization.buildings.map((building) => building.formatToType()),
      }).where(eq(civilizationTable.id, civilization.id))
      for (const civilizationResource of civilization.resources) {
        await this.client.update(civilizationsResourcesTable).set({
          quantity: civilizationResource.quantity,
        }).where(
          and(
            eq(civilizationsResourcesTable.civilizationId, civilization.id),
            eq(civilizationsResourcesTable.resourceType, civilizationResource.type),
          )
        )
      }
    }
  }

  async delete(userId: string, civilizationId: string) {
    const [civilizationLink] = await this.client
      .select()
      .from(usersCivilizationTable)
      .where(
        and(
          eq(usersCivilizationTable.userId, userId),
          eq(usersCivilizationTable.civilizationId, civilizationId)
        )
      )

    if (!civilizationLink) {
      throw new Error('No civilization found')
    }

    await this.client.delete(civilizationsResourcesTable).where(eq(civilizationsResourcesTable.civilizationId, civilizationId))
    await this.client.delete(civilizationsWorldTable).where(eq(civilizationsWorldTable.civilizationId, civilizationId))
    await this.client.delete(usersCivilizationTable).where(eq(usersCivilizationTable.civilizationId, civilizationId))
    await this.client.delete(civilizationTable).where(eq(civilizationTable.id, civilizationId))
  }

  async exist(civilizationName: string): Promise<boolean> {
    const [{ value }] = await this.client.select({ value: count(civilizationTable.id) }).from(civilizationTable).where(eq(civilizationTable.name, civilizationName))

    return value !== 0
  }
}