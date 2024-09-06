import { useRune } from './sharedStore'

export type State = {
  toast: null | { type: 'success' | 'error' | 'loading' | 'info'; message: string }
}

export const useState = () => useRune<State>('plop', { toast: null })