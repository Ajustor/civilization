import { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { usersTable, UserCreation } from '../../../db/schema/users'
import { and, eq, or } from 'drizzle-orm'

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

  async getUser({ username, password }: { username: string, password: string }) {
    return this.client.select({
      username: usersTable.username,
      email: usersTable.email,
      civilizations: usersTable.civilizations
    }).from(usersTable).where(and(
      or(
        eq(usersTable.username, username),
        eq(usersTable.email, username)
      ),
      eq(usersTable.password, password)
    ))

  }
}