import { Gender, OccupationTypes, ResourceTypes } from '@ajustor/simulation'

import { UsersTable } from './src/modules/users/database'
import { civilizationTable } from './db/schema/civilizations'
import { civilizationsResourcesTable } from './db/schema/civilizationsResourcesTable'
import { db } from './src/libs/database'
import { eq } from 'drizzle-orm'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { worldsResourcesTable } from './db/schema/worldsResourcesTable'
import { worldsTable } from './db/schema/worldSchema'

await migrate(db, { migrationsFolder: './drizzle' })

const usersTable = new UsersTable(db)

console.log('Start adding authorization keys to users')
await usersTable.addAuthorizationKeys()
console.log('Authorization keys added')


const citizensMigrations = async () => {
  console.log('Start citizens migrations')
  // Add genders
  const civilizations = await db.select().from(civilizationTable)
  const genders = [Gender.MALE, Gender.FEMALE]
  const occupations = [OccupationTypes.CARPENTER, OccupationTypes.FARMER]

  const updatedCiv = civilizations.map((civ) => ({
    ...civ,
    citizens: civ.citizens.map((citizen, idx) =>
    ({
      ...citizen,
      occupation: citizen.occupation ?? (citizen as any).profession ?? occupations[idx % 2],
      gender: citizen.gender ?? genders[idx % 2]
    })
    )
  }))

  for (const civ of updatedCiv) {
    await db.update(civilizationTable).set({ citizens: civ.citizens }).where(eq(civilizationTable.id, civ.id))
  }
  console.log('Migration success')
}

const resourceSync = async () => {
  console.log('Start resources syncing')

  const defaultResources = [
    {
      resourceType: ResourceTypes.FOOD,
      quantity: 10000
    },
    {
      resourceType: ResourceTypes.WOOD,
      quantity: 5000
    },
    {
      resourceType: ResourceTypes.STONE,
      quantity: 5000
    },
  ]

  const worlds = await db.select().from(worldsTable)
  const worldResources = await db.select().from(worldsResourcesTable)

  const worldResourcesToAdd = worlds.reduce<{ resourceType: ResourceTypes, quantity: number, worldId: string }[]>((accWorlds, world) => {
    const worldAvalaibleResources = worldResources.filter(({ worldId }) => worldId === world.id).map(({ resourceType }) => resourceType)
    const toAdd = defaultResources.reduce<{ resourceType: ResourceTypes, quantity: number, worldId: string }[]>((acc, resource) => {
      if (worldAvalaibleResources.includes(resource.resourceType)) {
        return acc
      }
      return [...acc, {
        ...resource,
        worldId: world.id
      }]
    }, [])

    return [...accWorlds, ...toAdd]
  }, [])

  const civs = await db.select().from(civilizationTable)
  const civResources = await db.select().from(civilizationsResourcesTable)

  const civResourcesToAdd = civs.reduce<{ resourceType: ResourceTypes, quantity: number, civilizationId: string }[]>((accCivs, civ) => {
    const civAvalaibleResources = civResources.filter(({ civilizationId }) => civilizationId === civ.id).map(({ resourceType }) => resourceType)
    const toAdd = defaultResources.reduce<{ resourceType: ResourceTypes, quantity: number, civilizationId: string }[]>((acc, resource) => {
      if (civAvalaibleResources.includes(resource.resourceType)) {
        return acc
      }
      return [...acc, {
        ...resource,
        quantity: 0,
        civilizationId: civ.id
      }]
    }, [])

    return [...accCivs, ...toAdd]
  }, [])

  if (worldResourcesToAdd.length) {
    await db.insert(worldsResourcesTable).values(worldResourcesToAdd)
  }

  if (civResourcesToAdd.length) {
    await db.insert(civilizationsResourcesTable).values(civResourcesToAdd)
  }


  console.log('Resources Sync Done')
  
    

}

await citizensMigrations()
await resourceSync()