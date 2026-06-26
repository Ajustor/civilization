import { BuildingTypes } from '../buildings/enum'

export enum TechId {
  CRAFTSMANSHIP = 'craftsmanship',
  MASONRY = 'masonry',
  AGRONOMY = 'agronomy',
  WAREHOUSING = 'warehousing',
  MECHANIZATION = 'mechanization',
  MEDICINE = 'medicine',
  METALLURGY = 'metallurgy',
  PHILOSOPHY = 'philosophy',
  IRRIGATION = 'irrigation',
  DEMOGRAPHY = 'demography',
  LOGISTICS = 'logistics',
  ARMORY = 'armory',
  ENGINEERING = 'engineering',
  SCIENCES = 'sciences',
}

export type TechEffect =
  | { kind: 'unlockBuilding'; building: BuildingTypes }
  | { kind: 'productionMultiplier'; factor: number }
  | { kind: 'storageMultiplier'; factor: number }
  | { kind: 'militaryMultiplier'; factor: number }
  | { kind: 'maxChildrenBonus'; amount: number }
  | { kind: 'pregnancyProbabilityBonus'; amount: number }
  | { kind: 'researchMultiplier'; factor: number }

export type TechNode = {
  id: TechId
  name: string
  description: string
  cost: number
  prerequisites: TechId[]
  effects: TechEffect[]
}

export const TECH_TREE: TechNode[] = [
  {
    id: TechId.CRAFTSMANSHIP,
    name: 'Artisanat',
    description: 'Débloque la Scierie et le Four à chaux.',
    cost: 5,
    prerequisites: [],
    effects: [
      { kind: 'unlockBuilding', building: BuildingTypes.SAWMILL },
      { kind: 'unlockBuilding', building: BuildingTypes.KILN },
    ],
  },
  {
    id: TechId.MASONRY,
    name: 'Maçonnerie',
    description: 'Débloque la Mine et la Muraille.',
    cost: 10,
    prerequisites: [TechId.CRAFTSMANSHIP],
    effects: [
      { kind: 'unlockBuilding', building: BuildingTypes.MINE },
      { kind: 'unlockBuilding', building: BuildingTypes.WALL },
    ],
  },
  {
    id: TechId.AGRONOMY,
    name: 'Agronomie',
    description: '+15 % de production des bâtiments.',
    cost: 8,
    prerequisites: [],
    effects: [{ kind: 'productionMultiplier', factor: 1.15 }],
  },
  {
    id: TechId.WAREHOUSING,
    name: 'Entreposage',
    description: '+50 % de capacité de stockage.',
    cost: 8,
    prerequisites: [],
    effects: [{ kind: 'storageMultiplier', factor: 1.5 }],
  },
  {
    id: TechId.MECHANIZATION,
    name: 'Mécanisation',
    description: '+25 % de production supplémentaire.',
    cost: 20,
    prerequisites: [TechId.AGRONOMY],
    effects: [{ kind: 'productionMultiplier', factor: 1.25 }],
  },
  {
    id: TechId.MEDICINE,
    name: 'Médecine',
    description: '+5 enfants simultanés et +10 % de conception.',
    cost: 12,
    prerequisites: [],
    effects: [
      { kind: 'maxChildrenBonus', amount: 5 },
      { kind: 'pregnancyProbabilityBonus', amount: 10 },
    ],
  },
  {
    id: TechId.METALLURGY,
    name: 'Métallurgie',
    description: '+25 % de force militaire.',
    cost: 15,
    prerequisites: [TechId.MASONRY],
    effects: [{ kind: 'militaryMultiplier', factor: 1.25 }],
  },
  {
    id: TechId.PHILOSOPHY,
    name: 'Philosophie',
    description: '+25 % de production de savoir.',
    cost: 10,
    prerequisites: [],
    effects: [{ kind: 'researchMultiplier', factor: 1.25 }],
  },
  {
    id: TechId.IRRIGATION,
    name: 'Irrigation',
    description: '+20 % de production des bâtiments.',
    cost: 12,
    prerequisites: [TechId.AGRONOMY],
    effects: [{ kind: 'productionMultiplier', factor: 1.20 }],
  },
  {
    id: TechId.DEMOGRAPHY,
    name: 'Démographie',
    description: '+3 enfants simultanés et +15 % de chances de conception.',
    cost: 15,
    prerequisites: [TechId.MEDICINE],
    effects: [
      { kind: 'maxChildrenBonus', amount: 3 },
      { kind: 'pregnancyProbabilityBonus', amount: 15 },
    ],
  },
  {
    id: TechId.LOGISTICS,
    name: 'Logistique',
    description: '+75 % de capacité de stockage supplémentaire.',
    cost: 15,
    prerequisites: [TechId.WAREHOUSING],
    effects: [{ kind: 'storageMultiplier', factor: 1.75 }],
  },
  {
    id: TechId.ARMORY,
    name: 'Armurerie',
    description: '+50 % de force militaire.',
    cost: 20,
    prerequisites: [TechId.METALLURGY],
    effects: [{ kind: 'militaryMultiplier', factor: 1.5 }],
  },
  {
    id: TechId.ENGINEERING,
    name: 'Ingénierie',
    description: '+30 % de production des bâtiments.',
    cost: 25,
    prerequisites: [TechId.MASONRY, TechId.MECHANIZATION],
    effects: [{ kind: 'productionMultiplier', factor: 1.30 }],
  },
  {
    id: TechId.SCIENCES,
    name: 'Sciences',
    description: '+50 % de production de savoir.',
    cost: 30,
    prerequisites: [TechId.PHILOSOPHY],
    effects: [{ kind: 'researchMultiplier', factor: 1.5 }],
  },
]

export const getTechNode = (id: TechId): TechNode | undefined =>
  TECH_TREE.find((node) => node.id === id)

// The tech that gates a building, or undefined if the building is available from the start.
export const getBuildingGate = (building: BuildingTypes): TechId | undefined => {
  for (const node of TECH_TREE) {
    for (const effect of node.effects) {
      if (effect.kind === 'unlockBuilding' && effect.building === building) {
        return node.id
      }
    }
  }
  return undefined
}
