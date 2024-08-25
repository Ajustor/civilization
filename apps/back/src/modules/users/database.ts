import { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { usersTable, UserCreation, UserWithCivilizations } from '../../../db/schema/users'
import { eq, or } from 'drizzle-orm'
import { civilizationTable } from '../../../db/schema/civilizations'
import { usersCivilizationTable } from '../../../db/schema/usersCivilizationsTable'
import { buildCivilization } from '../civilizations/database'

export type GetOptions = {
  populate: {
    civilizations: boolean
  }
}

export class UsersTable {
  constructor(private readonly client: BunSQLiteDatabase) {

  }

  async getAll(options?: GetOptions) {
    const users = await this.client
      .select()
      .from(usersTable)

    return users
  }

  async create(user: UserCreation) {
    await this.client.insert(usersTable).values(user)
  }

  async getAuthUser({ username, password }: { username: string, password: string }) {
    const [retrievedUser] = await this.client.select({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      password: usersTable.password
    }).from(usersTable).where(or(
      eq(usersTable.username, username),
      eq(usersTable.email, username)
    ))

    if (!retrievedUser) {
      return null
    }

    const isPasswordValid = await Bun.password.verify(password, retrievedUser.password)
    if (!isPasswordValid) {
      return null
    }

    const { password: _, ...user } = retrievedUser
    return user
  }

  async getUser(id: string): Promise<UserWithCivilizations | null> {
    const [user] = await this.client.select({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
    }).from(usersTable).where(eq(usersTable.id, id))

    if (!user) {
      return null
    }

    const userWithCivilizations: UserWithCivilizations = { ...user, civilizations: [] }
    const usersCivilizations = await this.client.select().from(usersCivilizationTable).where(eq(usersCivilizationTable.userId, id)).rightJoin(civilizationTable, eq(civilizationTable.id, usersCivilizationTable.civilizationId)).groupBy(usersCivilizationTable.userId)


    for (const { civilizations } of usersCivilizations) {
      userWithCivilizations.civilizations.push(await buildCivilization(this.client, civilizations))
    }

    return userWithCivilizations
  }
}