import { People } from './people/people'
import { Resource, ResourceTypes } from './resource'
import type { TechId } from './technology/techTree'

export type ResourceTransfer = {
  type: ResourceTypes
  amount: number
}

export type SplitParams = {
  populationPercent: number
  resourceTransfers: ResourceTransfer[]
  techsToTransmit: TechId[]
}

export type SplitResult = {
  colonyPeople: People[]
  colonyResources: Resource[]
  motherPeople: People[]
  motherResources: Resource[]
}

export function splitCivilization(
  allPeople: People[],
  allResources: Resource[],
  params: SplitParams,
): SplitResult {
  const transferCount = Math.floor(allPeople.length * params.populationPercent / 100)

  const shuffled = [...allPeople].sort(() => Math.random() - 0.5)
  const colonyPeople = shuffled.slice(0, transferCount)
  const motherPeople = shuffled.slice(transferCount)

  const motherResources = allResources.map((r) => new Resource(r.type, r.quantity))
  const colonyResources: Resource[] = []

  for (const transfer of params.resourceTransfers) {
    if (transfer.amount <= 0) continue
    const motherRes = motherResources.find((r) => r.type === transfer.type)
    if (!motherRes) continue
    const actual = Math.min(transfer.amount, motherRes.quantity)
    if (actual <= 0) continue
    motherRes.decrease(actual)
    colonyResources.push(new Resource(transfer.type, actual))
  }

  return { colonyPeople, colonyResources, motherPeople, motherResources }
}
