import { Gender } from '@ajustor/simulation'
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


// Add genders
const civilizations = await db.select().from(civilizationTable)
const genders = [Gender.MALE, Gender.FEMALE]

const updatedCiv = civilizations.map((civ) => ({
  ...civ,
  citizens: civ.citizens.map((citizen, idx) =>
    ({
      ...citizen,
      gender: citizen.gender ?? genders[idx%2]

    })
  )
}))

for (const civ of updatedCiv) {
  db.update(civilizationTable).set({ citizens: civ.citizens }).where(eq(civilizationTable.id, civ.id))
}
