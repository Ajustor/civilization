import { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { usersTable, UserCreation, UserWithCivilizations } from '../../../db/schema/users'
import { and, count, eq, or } from 'drizzle-orm'
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
    const [createdUser] = await this.client.insert(usersTable).values(user).returning()
    this.addAuthorizationKey(createdUser.id)
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

  async getById(id: string): Promise<UserWithCivilizations | null> {
    const [user] = await this.client.select({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      authorizationKey: usersTable.authorizationKey
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

  async getByEmail(email: string) {
    const [user] = await this.client.select({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      authorizationKey: usersTable.authorizationKey
    }).from(usersTable).where(eq(usersTable.email, email))

    if (!user) {
      return null
    }

    return user
  }

  async resetPassword({ userId, password, authorizationKey }: { userId: string, password: string, authorizationKey: string }) {
    const newPassword = await Bun.password.hash(password)
    const [foundUser] = await this.client.select({
      id: usersTable.id,
    }).from(usersTable).where(and(
      eq(usersTable.id, userId),
      eq(usersTable.authorizationKey, authorizationKey)
    ))

    if (!foundUser) {
      throw new Error('No user found with this informations')
    }

    await this.client.update(usersTable).set({ password: newPassword }).where(and(
      eq(usersTable.id, userId),
      eq(usersTable.authorizationKey, authorizationKey)
    ))


    await this.addAuthorizationKey(userId)
  }

  async addAuthorizationKey(userId: string) {
    const [user] = await this.client.select().from(usersTable).where(eq(usersTable.id, userId))

    const hasher = new Bun.CryptoHasher("blake2b256")

    const rawKey = `${user.id}${user.password}${user.email}`
    const authorizationKey = hasher.update(rawKey, 'base64')
    await this.client.update(usersTable).set({
      authorizationKey: authorizationKey.digest('hex')
    }).where(eq(usersTable.id, user.id))

  }

  async addAuthorizationKeys() {
    const users = await this.client.select().from(usersTable)

    for (const user of users) {
      this.addAuthorizationKey(user.id)
    }
  }

  async exist(emailOrUsername: string): Promise<boolean> {
    const [{ value }] = await this.client.select({ value: count(usersTable.id) }).from(usersTable).where((or(
      eq(usersTable.username, emailOrUsername),
      eq(usersTable.email, emailOrUsername)
    )))

    return value !== 0
  }

}