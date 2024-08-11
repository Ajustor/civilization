import { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { usersTable, UserEntity } from '../../../db/schema/users'

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

  async create(user: UserEntity) {
    await this.client.insert(usersTable).values(user)
  }
}