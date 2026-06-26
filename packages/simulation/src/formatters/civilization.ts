import type { Civilization } from '../civilization'
import type { CivilizationType } from '../types/civilization'

export function formatCivilizations(civilizations: Civilization[]): CivilizationType[] {
  return civilizations.map((civilization) => ({
    name: civilization.name,
    id: civilization.id,
    livedMonths: civilization.livedMonths,
    researchPoints: civilization.researchPoints,
    researchedTechs: civilization.researchedTechs,
    citizensCount: civilization.citizensCount,
    people: civilization.people?.filter((person) => person).map((person) => person.formatToType()),
    resources: civilization.resources.map((resource) => resource.formatToType()),
    buildings: civilization.buildings.map((building) => building.formatToType()),
    config: civilization.config,
    pendingConstructions: civilization.pendingConstructions
  }))
}
