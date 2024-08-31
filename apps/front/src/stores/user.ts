import { useRune } from './sharedStore'

export type User = { username: string, id: string, email: string }

export const useUser = (defaultUser: User | null = null) => useRune('user', defaultUser)