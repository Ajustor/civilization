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
  ALCHEMY = 'alchemy',
  HYDRAULICS = 'hydraulics',
  ASTRONOMY = 'astronomy',
  URBANISM = 'urbanism',
  COMMERCE = 'commerce',
  HUSBANDRY = 'husbandry',
  POTTERY = 'pottery',
  HUNTING = 'hunting',
  FORTIFICATION = 'fortification',
  THEOLOGY = 'theology',
  NAVIGATION = 'navigation',
  CARTOGRAPHY = 'cartography',
  INDUSTRY = 'industry',
  ARTILLERY = 'artillery',
  ADVANCED_MEDICINE = 'advanced_medicine',
  DIPLOMACY = 'diplomacy',
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
  {
    id: TechId.ALCHEMY,
    name: 'Alchimie',
    description: '+20 % de production et +5 % de chances de conception.',
    cost: 25,
    prerequisites: [TechId.METALLURGY, TechId.MEDICINE],
    effects: [
      { kind: 'productionMultiplier', factor: 1.20 },
      { kind: 'pregnancyProbabilityBonus', amount: 5 },
    ],
  },
  {
    id: TechId.HYDRAULICS,
    name: 'Hydraulique',
    description: '+30 % de stockage et +15 % de production.',
    cost: 20,
    prerequisites: [TechId.IRRIGATION, TechId.MASONRY],
    effects: [
      { kind: 'storageMultiplier', factor: 1.30 },
      { kind: 'productionMultiplier', factor: 1.15 },
    ],
  },
  {
    id: TechId.ASTRONOMY,
    name: 'Astronomie',
    description: '×2 de production de savoir.',
    cost: 30,
    prerequisites: [TechId.SCIENCES],
    effects: [{ kind: 'researchMultiplier', factor: 2.0 }],
  },
  {
    id: TechId.URBANISM,
    name: 'Urbanisme',
    description: '+4 enfants simultanés et +10 % de chances de conception.',
    cost: 25,
    prerequisites: [TechId.ENGINEERING],
    effects: [
      { kind: 'maxChildrenBonus', amount: 4 },
      { kind: 'pregnancyProbabilityBonus', amount: 10 },
    ],
  },
  {
    id: TechId.COMMERCE,
    name: 'Commerce',
    description: '+50 % de capacité de stockage.',
    cost: 15,
    prerequisites: [TechId.LOGISTICS],
    effects: [{ kind: 'storageMultiplier', factor: 1.50 }],
  },
  {
    id: TechId.HUSBANDRY,
    name: 'Élevage',
    description: '+10 % de production des bâtiments.',
    cost: 6,
    prerequisites: [],
    effects: [{ kind: 'productionMultiplier', factor: 1.10 }],
  },
  {
    id: TechId.POTTERY,
    name: 'Poterie',
    description: '+20 % de capacité de stockage.',
    cost: 7,
    prerequisites: [],
    effects: [{ kind: 'storageMultiplier', factor: 1.20 }],
  },
  {
    id: TechId.HUNTING,
    name: 'Chasse',
    description: '+15 % de production et +5 % de chances de conception.',
    cost: 12,
    prerequisites: [TechId.HUSBANDRY],
    effects: [
      { kind: 'productionMultiplier', factor: 1.15 },
      { kind: 'pregnancyProbabilityBonus', amount: 5 },
    ],
  },
  {
    id: TechId.FORTIFICATION,
    name: 'Fortification',
    description: '+20 % de force militaire.',
    cost: 22,
    prerequisites: [TechId.MASONRY],
    effects: [{ kind: 'militaryMultiplier', factor: 1.20 }],
  },
  {
    id: TechId.THEOLOGY,
    name: 'Théologie',
    description: '+40 % de production de savoir et +5 % de chances de conception.',
    cost: 28,
    prerequisites: [TechId.PHILOSOPHY, TechId.SCIENCES],
    effects: [
      { kind: 'researchMultiplier', factor: 1.40 },
      { kind: 'pregnancyProbabilityBonus', amount: 5 },
    ],
  },
  {
    id: TechId.NAVIGATION,
    name: 'Navigation',
    description: '+30 % de capacité de stockage.',
    cost: 25,
    prerequisites: [TechId.COMMERCE],
    effects: [{ kind: 'storageMultiplier', factor: 1.30 }],
  },
  {
    id: TechId.CARTOGRAPHY,
    name: 'Cartographie',
    description: '+30 % de production de savoir.',
    cost: 35,
    prerequisites: [TechId.ASTRONOMY],
    effects: [{ kind: 'researchMultiplier', factor: 1.30 }],
  },
  {
    id: TechId.INDUSTRY,
    name: 'Industrie',
    description: '+40 % de production des bâtiments.',
    cost: 40,
    prerequisites: [TechId.ENGINEERING],
    effects: [{ kind: 'productionMultiplier', factor: 1.40 }],
  },
  {
    id: TechId.ARTILLERY,
    name: 'Artillerie',
    description: '+60 % de force militaire.',
    cost: 40,
    prerequisites: [TechId.ARMORY, TechId.ENGINEERING],
    effects: [{ kind: 'militaryMultiplier', factor: 1.60 }],
  },
  {
    id: TechId.ADVANCED_MEDICINE,
    name: 'Médecine Avancée',
    description: '+4 enfants simultanés et +15 % de chances de conception.',
    cost: 40,
    prerequisites: [TechId.DEMOGRAPHY, TechId.ALCHEMY],
    effects: [
      { kind: 'maxChildrenBonus', amount: 4 },
      { kind: 'pregnancyProbabilityBonus', amount: 15 },
    ],
  },
  {
    id: TechId.DIPLOMACY,
    name: 'Diplomatie',
    description: '+30 % de stockage et +10 % de force militaire.',
    cost: 45,
    prerequisites: [TechId.URBANISM, TechId.COMMERCE],
    effects: [
      { kind: 'storageMultiplier', factor: 1.30 },
      { kind: 'militaryMultiplier', factor: 1.10 },
    ],
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
