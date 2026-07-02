import type { BuildingType } from './building'
import type { PeopleType } from '..'
import type { ResourceType } from './resources'
import { BuildingTypes } from '../buildings/enum'
import type { OccupationTypes } from '../people/work/enum'

export type PendingConstruction = {
  buildingType: BuildingTypes
  monthsRemaining: number
}

export type CivilizationConfig = {
  PREGNANCY_PROBABILITY: number
  MAX_ACTIVE_PEOPLE_BY_CIVILIZATION: number
  PEOPLE_CHARCOAL_CAN_HEAT: number
  CHANCE_TO_EVOLVE: number
  CHANCE_TO_BUILD_EVOLVED_BUILDING: number
  // Maximum number of simultaneous children, expressed as a percentage of the
  // civilization's adult (non-child) population.
  MAXIMUM_CHILDREN_PERCENTAGE: number
  OPEN_EXCHANGE: string[]
  AT_WAR_WITH: string[]
  MILITARY_RATIO: number
  NEXT_BUILDING_TO_BUILD: BuildingTypes | null
  SPEED_MODE: boolean
  // Répartition cible des métiers assignables (pourcentages entiers sommant à 100).
  // Pilote l'évolution des métiers (remplir en priorité les créneaux désirés) et la
  // construction (bâtir tant que la cible dépasse la capacité). Les soldats sont hors
  // jauges (gérés par MILITARY_RATIO). Optionnel : les civilisations persistées avant
  // cette migration n'ont pas le champ ; le code retombe alors sur la valeur par défaut.
  OCCUPATION_DISTRIBUTION?: Partial<Record<OccupationTypes, number>>
}


export type CivilizationType = {
  id: string
  name: string
  livedMonths: number
  researchPoints: number
  researchedTechs: string[]
  people?: PeopleType[],
  resources: ResourceType[],
  buildings: BuildingType[],
  citizensCount?: number,
  config: CivilizationConfig
  pendingConstructions: PendingConstruction[]
  // Monde auquel appartient la civilisation. Optionnel car `formatCivilizations`
  // ne le connaît pas (donnée de persistance) : les routes API l'enrichissent.
  worldId?: string | null
  worldName?: string | null
}
