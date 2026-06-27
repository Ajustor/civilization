import { BuildingTypes } from '../buildings/enum'

export enum TechId {
  // — Tier 0 (racines) —
  CRAFTSMANSHIP = 'craftsmanship',
  AGRONOMY = 'agronomy',
  WAREHOUSING = 'warehousing',
  MEDICINE = 'medicine',
  PHILOSOPHY = 'philosophy',
  HUSBANDRY = 'husbandry',
  POTTERY = 'pottery',
  WRITING = 'writing',
  FISHING = 'fishing',
  HERBAL_MEDICINE = 'herbal_medicine',
  // — Tier 1 —
  MASONRY = 'masonry',
  MECHANIZATION = 'mechanization',
  IRRIGATION = 'irrigation',
  DEMOGRAPHY = 'demography',
  LOGISTICS = 'logistics',
  HUNTING = 'hunting',
  WEAVING = 'weaving',
  ANIMAL_TRACTION = 'animal_traction',
  ACCOUNTING = 'accounting',
  MIDWIFERY = 'midwifery',
  // — Tier 2 —
  METALLURGY = 'metallurgy',
  ENGINEERING = 'engineering',
  SCIENCES = 'sciences',
  ALCHEMY = 'alchemy',
  HYDRAULICS = 'hydraulics',
  FORTIFICATION = 'fortification',
  TANNING = 'tanning',
  MILITIA = 'militia',
  CROP_ROTATION = 'crop_rotation',
  PRINTING = 'printing',
  // — Tier 3 —
  ARMORY = 'armory',
  THEOLOGY = 'theology',
  URBANISM = 'urbanism',
  COMMERCE = 'commerce',
  ASTRONOMY = 'astronomy',
  STEEL = 'steel',
  BANKING = 'banking',
  MECHANIZED_AGRICULTURE = 'mechanized_agriculture',
  RENAISSANCE = 'renaissance',
  SANITATION = 'sanitation',
  ADVANCED_LOGISTICS = 'advanced_logistics',
  // — Tier 4 —
  ARTILLERY = 'artillery',
  ADVANCED_MEDICINE = 'advanced_medicine',
  NAVIGATION = 'navigation',
  CARTOGRAPHY = 'cartography',
  INDUSTRY = 'industry',
  DIPLOMACY = 'diplomacy',
  SIEGE_WEAPONS = 'siege_weapons',
  CHEMISTRY = 'chemistry',
  CIVIC_ADMINISTRATION = 'civic_administration',
  SHIPBUILDING = 'shipbuilding',
  UNIVERSITY = 'university',
  // — Tier 5 —
  GUNPOWDER = 'gunpowder',
  ECONOMICS = 'economics',
  INDUSTRIAL_CHEMISTRY = 'industrial_chemistry',
  MILITARY_STRATEGY = 'military_strategy',
  PUBLIC_HEALTH = 'public_health',
  COLONIZATION = 'colonization',
  // — Tier 6 —
  INDUSTRIALIZATION = 'industrialization',
  EMPIRE = 'empire',
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
  // ═══════════════════════════════════════════════════════════════
  // TIER 0 — Racines (aucun prérequis)
  // ═══════════════════════════════════════════════════════════════
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
    id: TechId.MEDICINE,
    name: 'Médecine',
    description: '+5 enfants par femme et +10 % de chances de conception.',
    cost: 12,
    prerequisites: [],
    effects: [
      { kind: 'maxChildrenBonus', amount: 5 },
      { kind: 'pregnancyProbabilityBonus', amount: 10 },
    ],
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
    id: TechId.WRITING,
    name: 'Écriture',
    description: '+15 % de production de savoir.',
    cost: 6,
    prerequisites: [],
    effects: [{ kind: 'researchMultiplier', factor: 1.15 }],
  },
  {
    id: TechId.FISHING,
    name: 'Pêche',
    description: '+12 % de production des bâtiments.',
    cost: 5,
    prerequisites: [],
    effects: [{ kind: 'productionMultiplier', factor: 1.12 }],
  },
  {
    id: TechId.HERBAL_MEDICINE,
    name: 'Médecine Herbale',
    description: '+8 % de chances de conception.',
    cost: 7,
    prerequisites: [],
    effects: [{ kind: 'pregnancyProbabilityBonus', amount: 8 }],
  },

  // ═══════════════════════════════════════════════════════════════
  // TIER 1
  // ═══════════════════════════════════════════════════════════════
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
    id: TechId.MECHANIZATION,
    name: 'Mécanisation',
    description: '+25 % de production supplémentaire.',
    cost: 20,
    prerequisites: [TechId.AGRONOMY],
    effects: [{ kind: 'productionMultiplier', factor: 1.25 }],
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
    description: '+3 enfants par femme et +15 % de chances de conception.',
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
    prerequisites: [TechId.WAREHOUSING, TechId.POTTERY],
    effects: [{ kind: 'storageMultiplier', factor: 1.75 }],
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
    id: TechId.WEAVING,
    name: 'Tissage',
    description: '+25 % de capacité de stockage.',
    cost: 12,
    prerequisites: [TechId.CRAFTSMANSHIP, TechId.POTTERY],
    effects: [{ kind: 'storageMultiplier', factor: 1.25 }],
  },
  {
    id: TechId.ANIMAL_TRACTION,
    name: 'Traction Animale',
    description: '+20 % de production des bâtiments.',
    cost: 14,
    prerequisites: [TechId.HUSBANDRY, TechId.AGRONOMY],
    effects: [{ kind: 'productionMultiplier', factor: 1.20 }],
  },
  {
    id: TechId.ACCOUNTING,
    name: 'Comptabilité',
    description: '+20 % de production de savoir.',
    cost: 11,
    prerequisites: [TechId.WRITING, TechId.POTTERY],
    effects: [{ kind: 'researchMultiplier', factor: 1.20 }],
  },
  {
    id: TechId.MIDWIFERY,
    name: 'Obstétrique',
    description: '+2 enfants par femme et +8 % de chances de conception.',
    cost: 13,
    prerequisites: [TechId.HERBAL_MEDICINE, TechId.MEDICINE],
    effects: [
      { kind: 'maxChildrenBonus', amount: 2 },
      { kind: 'pregnancyProbabilityBonus', amount: 8 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // TIER 2
  // ═══════════════════════════════════════════════════════════════
  {
    id: TechId.METALLURGY,
    name: 'Métallurgie',
    description: '+25 % de force militaire.',
    cost: 15,
    prerequisites: [TechId.MASONRY],
    effects: [{ kind: 'militaryMultiplier', factor: 1.25 }],
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
    id: TechId.FORTIFICATION,
    name: 'Fortification',
    description: '+20 % de force militaire.',
    cost: 22,
    prerequisites: [TechId.MASONRY],
    effects: [{ kind: 'militaryMultiplier', factor: 1.20 }],
  },
  {
    id: TechId.TANNING,
    name: 'Tannerie',
    description: '+15 % de production des bâtiments.',
    cost: 16,
    prerequisites: [TechId.HUNTING],
    effects: [{ kind: 'productionMultiplier', factor: 1.15 }],
  },
  {
    id: TechId.MILITIA,
    name: 'Milice',
    description: '+20 % de force militaire.',
    cost: 18,
    prerequisites: [TechId.HUNTING, TechId.CRAFTSMANSHIP],
    effects: [{ kind: 'militaryMultiplier', factor: 1.20 }],
  },
  {
    id: TechId.CROP_ROTATION,
    name: 'Assolement',
    description: '+25 % de production des bâtiments.',
    cost: 20,
    prerequisites: [TechId.IRRIGATION, TechId.AGRONOMY],
    effects: [{ kind: 'productionMultiplier', factor: 1.25 }],
  },
  {
    id: TechId.PRINTING,
    name: 'Imprimerie',
    description: '+60 % de production de savoir.',
    cost: 22,
    prerequisites: [TechId.WRITING, TechId.SCIENCES],
    effects: [{ kind: 'researchMultiplier', factor: 1.60 }],
  },

  // ═══════════════════════════════════════════════════════════════
  // TIER 3
  // ═══════════════════════════════════════════════════════════════
  {
    id: TechId.ARMORY,
    name: 'Armurerie',
    description: '+50 % de force militaire.',
    cost: 20,
    prerequisites: [TechId.METALLURGY],
    effects: [{ kind: 'militaryMultiplier', factor: 1.5 }],
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
    id: TechId.URBANISM,
    name: 'Urbanisme',
    description: '+4 enfants par femme et +10 % de chances de conception.',
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
    id: TechId.ASTRONOMY,
    name: 'Astronomie',
    description: '×2 de production de savoir.',
    cost: 30,
    prerequisites: [TechId.SCIENCES],
    effects: [{ kind: 'researchMultiplier', factor: 2.0 }],
  },
  {
    id: TechId.STEEL,
    name: 'Acier',
    description: '+40 % de force militaire.',
    cost: 28,
    prerequisites: [TechId.METALLURGY],
    effects: [{ kind: 'militaryMultiplier', factor: 1.40 }],
  },
  {
    id: TechId.BANKING,
    name: 'Banque',
    description: '+60 % de capacité de stockage.',
    cost: 25,
    prerequisites: [TechId.COMMERCE, TechId.ACCOUNTING],
    effects: [{ kind: 'storageMultiplier', factor: 1.60 }],
  },
  {
    id: TechId.MECHANIZED_AGRICULTURE,
    name: 'Agriculture Mécanisée',
    description: '+35 % de production des bâtiments.',
    cost: 30,
    prerequisites: [TechId.MECHANIZATION, TechId.CROP_ROTATION],
    effects: [{ kind: 'productionMultiplier', factor: 1.35 }],
  },
  {
    id: TechId.RENAISSANCE,
    name: 'Renaissance',
    description: '+80 % de production de savoir et +10 % de production.',
    cost: 32,
    prerequisites: [TechId.ASTRONOMY, TechId.PRINTING],
    effects: [
      { kind: 'researchMultiplier', factor: 1.80 },
      { kind: 'productionMultiplier', factor: 1.10 },
    ],
  },
  {
    id: TechId.SANITATION,
    name: 'Assainissement',
    description: '+3 enfants par femme et +20 % de chances de conception.',
    cost: 30,
    prerequisites: [TechId.HYDRAULICS, TechId.MIDWIFERY],
    effects: [
      { kind: 'maxChildrenBonus', amount: 3 },
      { kind: 'pregnancyProbabilityBonus', amount: 20 },
    ],
  },
  {
    id: TechId.ADVANCED_LOGISTICS,
    name: 'Logistique Avancée',
    description: '+100 % de capacité de stockage supplémentaire.',
    cost: 28,
    prerequisites: [TechId.LOGISTICS, TechId.ENGINEERING],
    effects: [{ kind: 'storageMultiplier', factor: 2.0 }],
  },

  // ═══════════════════════════════════════════════════════════════
  // TIER 4
  // ═══════════════════════════════════════════════════════════════
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
    description: '+4 enfants par femme et +15 % de chances de conception.',
    cost: 40,
    prerequisites: [TechId.DEMOGRAPHY, TechId.ALCHEMY],
    effects: [
      { kind: 'maxChildrenBonus', amount: 4 },
      { kind: 'pregnancyProbabilityBonus', amount: 15 },
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
  {
    id: TechId.SIEGE_WEAPONS,
    name: 'Engins de Siège',
    description: '+35 % de force militaire.',
    cost: 35,
    prerequisites: [TechId.ENGINEERING, TechId.ARMORY],
    effects: [{ kind: 'militaryMultiplier', factor: 1.35 }],
  },
  {
    id: TechId.CHEMISTRY,
    name: 'Chimie',
    description: '+25 % de production des bâtiments.',
    cost: 35,
    prerequisites: [TechId.ALCHEMY, TechId.SCIENCES],
    effects: [{ kind: 'productionMultiplier', factor: 1.25 }],
  },
  {
    id: TechId.CIVIC_ADMINISTRATION,
    name: 'Administration Civile',
    description: '+2 enfants par femme et +25 % de production de savoir.',
    cost: 35,
    prerequisites: [TechId.URBANISM, TechId.ACCOUNTING],
    effects: [
      { kind: 'maxChildrenBonus', amount: 2 },
      { kind: 'researchMultiplier', factor: 1.25 },
    ],
  },
  {
    id: TechId.SHIPBUILDING,
    name: 'Construction Navale',
    description: '+30 % de production et +20 % de stockage.',
    cost: 35,
    prerequisites: [TechId.NAVIGATION, TechId.TANNING],
    effects: [
      { kind: 'productionMultiplier', factor: 1.30 },
      { kind: 'storageMultiplier', factor: 1.20 },
    ],
  },
  {
    id: TechId.UNIVERSITY,
    name: 'Université',
    description: '×2,5 de production de savoir.',
    cost: 45,
    prerequisites: [TechId.RENAISSANCE, TechId.THEOLOGY],
    effects: [{ kind: 'researchMultiplier', factor: 2.50 }],
  },

  // ═══════════════════════════════════════════════════════════════
  // TIER 5
  // ═══════════════════════════════════════════════════════════════
  {
    id: TechId.GUNPOWDER,
    name: 'Poudre à Canon',
    description: '+70 % de force militaire.',
    cost: 50,
    prerequisites: [TechId.CHEMISTRY, TechId.ARTILLERY],
    effects: [{ kind: 'militaryMultiplier', factor: 1.70 }],
  },
  {
    id: TechId.ECONOMICS,
    name: 'Économie',
    description: '+80 % de capacité de stockage.',
    cost: 50,
    prerequisites: [TechId.BANKING, TechId.DIPLOMACY],
    effects: [{ kind: 'storageMultiplier', factor: 1.80 }],
  },
  {
    id: TechId.INDUSTRIAL_CHEMISTRY,
    name: 'Chimie Industrielle',
    description: '+50 % de production des bâtiments.',
    cost: 50,
    prerequisites: [TechId.CHEMISTRY, TechId.INDUSTRY],
    effects: [{ kind: 'productionMultiplier', factor: 1.50 }],
  },
  {
    id: TechId.MILITARY_STRATEGY,
    name: 'Stratégie Militaire',
    description: '+50 % de force militaire.',
    cost: 52,
    prerequisites: [TechId.SIEGE_WEAPONS, TechId.DIPLOMACY],
    effects: [{ kind: 'militaryMultiplier', factor: 1.50 }],
  },
  {
    id: TechId.PUBLIC_HEALTH,
    name: 'Santé Publique',
    description: '+5 enfants par femme et +30 % de chances de conception.',
    cost: 48,
    prerequisites: [TechId.SANITATION, TechId.ADVANCED_MEDICINE],
    effects: [
      { kind: 'maxChildrenBonus', amount: 5 },
      { kind: 'pregnancyProbabilityBonus', amount: 30 },
    ],
  },
  {
    id: TechId.COLONIZATION,
    name: 'Colonisation',
    description: '+30 % de production et +30 % de stockage.',
    cost: 50,
    prerequisites: [TechId.SHIPBUILDING, TechId.CARTOGRAPHY],
    effects: [
      { kind: 'productionMultiplier', factor: 1.30 },
      { kind: 'storageMultiplier', factor: 1.30 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // TIER 6
  // ═══════════════════════════════════════════════════════════════
  {
    id: TechId.INDUSTRIALIZATION,
    name: 'Industrialisation',
    description: '+60 % de production des bâtiments.',
    cost: 65,
    prerequisites: [TechId.INDUSTRIAL_CHEMISTRY, TechId.MECHANIZED_AGRICULTURE],
    effects: [{ kind: 'productionMultiplier', factor: 1.60 }],
  },
  {
    id: TechId.EMPIRE,
    name: 'Empire',
    description: '+70 % de force militaire et +30 % de stockage.',
    cost: 68,
    prerequisites: [TechId.MILITARY_STRATEGY, TechId.COLONIZATION],
    effects: [
      { kind: 'militaryMultiplier', factor: 1.70 },
      { kind: 'storageMultiplier', factor: 1.30 },
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
