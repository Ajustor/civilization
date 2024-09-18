import { BuildingTypes, Civilization, CivilizationBuilder, Gender, House, PeopleBuilder, Resource } from '@ajustor/simulation'
import { CivilizationEntity, civilizationTable } from '../../../db/schema/civilizations'
import { and, count, eq, inArray } from 'drizzle-orm'

import { LibSQLDatabase } from 'drizzle-orm/libsql'
import { civilizationsResourcesTable } from '../../../db/schema/civilizationsResourcesTable'
import { civilizationsWorldTable } from '../../../db/schema/civilizationsWorldsTable'
import { usersCivilizationTable } from '../../../db/schema/usersCivilizationsTable'
import { worldsTable } from '../../../db/schema/worldSchema'
import { sqliteClient } from '../../libs/database'

export type FieldsToRemove = {
  lineage?: boolean
}

export async function buildCivilization(dbClient: LibSQLDatabase, civilization: CivilizationEntity, fieldsToRemove?: FieldsToRemove): Promise<Civilization> {
  const builder = new CivilizationBuilder()
  const civilizationResources = await dbClient.select().from(civilizationsResourcesTable).where(eq(civilizationsResourcesTable.civilizationId, civilization.id))

  for (const civilizationResource of civilizationResources) {
    const resource = new Resource(civilizationResource.resourceType, civilizationResource.quantity)
    builder.addResource(resource)
  }


  for (const building of civilization.buildings) {
    if (building.type === BuildingTypes.HOUSE) {
      const house = new House(building.capacity ?? 0)
      house.count = building.count

      builder.addBuilding(house)
    }
  }

  builder.addCitizen(...civilization.people.map(({ id, name, gender, month, lifeCounter, occupation, buildingMonthsLeft, isBuilding, pregnancyMonthsLeft, child, lineage }) => {
    const peopleBuilder = new PeopleBuilder()
      .withId(id)
      .withGender(gender)
      .withMonth(month)
      .withName(name)
      .withLifeCounter(lifeCounter)
      .withIsBuilding(isBuilding)
      .withBuildingMonthsLeft(buildingMonthsLeft)

    if (occupation) {
      peopleBuilder.withOccupation(occupation)
    }

    if (pregnancyMonthsLeft && gender === Gender.FEMALE) {
      peopleBuilder.withPregnancyMonthsLeft(pregnancyMonthsLeft)
    }

    if (child && gender === Gender.FEMALE) {
      peopleBuilder.withChild(child)
    }

    if (lineage && !fieldsToRemove?.lineage) {
      peopleBuilder.withLineage(lineage)
    }

    return peopleBuilder.build()
  }))

  return builder.withId(civilization.id).withLivedMonths(civilization.livedMonths).withName(civilization.name).build()
}

export class CivilizationTable {
  constructor(private readonly client: LibSQLDatabase) {

  }

  private async buildCivilizations(fieldsToRemove: FieldsToRemove, ...civilizations: CivilizationEntity[]): Promise<Civilization[]> {
    return Promise.all(civilizations.map((civilization) => buildCivilization(this.client, civilization, fieldsToRemove)))
  }

  async getAllByWorldId(worldId: string): Promise<Civilization[]> {
    const civilizationIds = await this.client.select({
      civilizationId: civilizationsWorldTable.civilizationId
    })
      .from(civilizationsWorldTable)
      .where(eq(civilizationsWorldTable.worldId, worldId))

    return this.getByIds(civilizationIds.map(({ civilizationId }) => civilizationId))
  }

  async getByIds(civilizationIds: string[]): Promise<Civilization[]> {
    const civilizations = await this.client
      .select()
      .from(civilizationTable)
      .where(inArray(civilizationTable.id, civilizationIds))

    return this.buildCivilizations({ lineage: true }, ...civilizations)
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

    return this.buildCivilizations({ lineage: true }, ...civilizations)
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

    return this.buildCivilizations({ lineage: true }, ...civilizations)
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
      people: civilization.people.map((person) => person.formatToEntity()),
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
    const queries: { params: any[], sql: string }[] = []
    for (const civilization of civilizations) {
      queries.push(this.client.update(civilizationTable).set({
        livedMonths: civilization.livedMonths,
        people: civilization.people.map((person) => person.formatToEntity()),
        buildings: civilization.buildings.map((building) => building.formatToType()),
      }).where(eq(civilizationTable.id, civilization.id)).toSQL())
      for (const civilizationResource of civilization.resources) {
        queries.push(this.client.update(civilizationsResourcesTable).set({
          quantity: civilizationResource.quantity,
        }).where(
          and(
            eq(civilizationsResourcesTable.civilizationId, civilization.id),
            eq(civilizationsResourcesTable.resourceType, civilizationResource.type),
          )
        ).toSQL())
      }
    }
    // Use the read db client is required here (system limit)
    await sqliteClient.batch(queries.map(({ params, ...rest }) => ({ ...rest, args: params })))
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