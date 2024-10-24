import { Civilization } from '../civilization'
import { World } from '../world'
import { Events } from './enum'

export type ActionInput = { world?: World, civilizations?: Civilization[] }

export interface WorldEvent {
  readonly type: Events

  actions(input: ActionInput): void
}