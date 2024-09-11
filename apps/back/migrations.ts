import { Gender, OccupationTypes } from '@ajustor/simulation'
import { UsersTable } from './src/modules/users/database'
import { civilizationTable } from './db/schema/civilizations'
import { db } from './src/libs/database'
import { eq } from 'drizzle-orm'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'

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

await citizensMigrations()