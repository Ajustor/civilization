import { Logger } from '@bogeychan/elysia-logger/src/types'
import type { UsersTable } from '../modules/users/database'

export type Dependencies = {
  log: Logger,
  userDbClient: UsersTable
}
