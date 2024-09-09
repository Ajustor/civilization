import type { Civilization } from '../civilization'
import type { CivilizationType } from '../types/civilization'

export function formatCivilizations(civilizations: Civilization[]): CivilizationType[] {
  return civilizations.map((civilization) => ({
    name: civilization.name,
    id: civilization.id,
    livedMonths: civilization.livedMonths,
    citizens: civilization.citizens
      .map((citizen) => citizen.formatToType()),
    resources: civilization.resources.map((resource) => resource.formatToType()),
    buildings: civilization.buildings.map((building) => building.formatToType())
  }))
}