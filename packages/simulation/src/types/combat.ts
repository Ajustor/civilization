import type { ResourceTypes } from '../resource'

export interface PlunderedResource {
  type: ResourceTypes
  amount: number
}

export interface CombatRecord {
  battleId: string
  month: number
  worldId: string
  attackerCivId: string
  defenderCivId: string
  attackerStrength: number
  defenderStrength: number
  attackerWins: boolean
  attackerLossRatio: number
  defenderLossRatio: number
  plunderedResources: PlunderedResource[]
  captivesTaken: number
}
