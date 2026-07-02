import type { ResourceTypes } from '@ajustor/simulation'
import {
	BuildingTypes,
	OccupationTypes,
	MINIMAL_AGE_TO_BECOME,
	RETIREMENT_AGE_BY_OCCUPATION,
	House,
	Tent,
	Farm,
	Kiln,
	Sawmill,
	Mine,
	Campfire,
	Cache,
	Wall,
	Library,
	Warehouse,
	getUpgradeRequirement
} from '@ajustor/simulation'
import { buildingNames } from './translations/buildings'

export type ResourceAmount = { resource: ResourceTypes; amount: number }
export type OperatingWorker = { occupation: OccupationTypes; count: number }
export type BuildWorker = { occupation: OccupationTypes; amount: number }

export type BuildingMeta = {
	type: BuildingTypes
	/** Sorties de production par mois (vide pour les bâtiments non productifs / extraction). */
	outputResources: ResourceAmount[]
	/** Entrées consommées (convertisseurs : feu de camp, scierie, four à chaux). */
	inputResources: ResourceAmount[]
	/** Main-d'œuvre nécessaire pour exploiter le bâtiment. */
	operatingWorkers: OperatingWorker[]
	/** Main-d'œuvre nécessaire pour le construire. */
	buildWorkers: BuildWorker[]
	constructionCosts: ResourceAmount[]
	timeToBuild: number
	/** Points de recherche / mois (Bibliothèque). */
	researchOutput?: number
	/** Citoyens logés (Tente, Maison). */
	housingCapacity?: number
	/** Note d'évolution (bâtiment de base consommé à la construction). */
	upgradeNote?: string
	/** Production aléatoire issue des données de la civ (Mine). */
	isExtraction?: boolean
	/** Texte d'effet éditorial pour les bâtiments non productifs. */
	effect?: string
}

export type OccupationMeta = {
	minAge: number
	/** null pour Enfant / Retraité (pas de tranche d'activité). */
	retirementAge: number | null
}

// Une classe par type de bâtiment (mêmes classes que la simulation).
const BUILDING_CLASSES = {
	[BuildingTypes.TENT]: Tent,
	[BuildingTypes.HOUSE]: House,
	[BuildingTypes.FARM]: Farm,
	[BuildingTypes.KILN]: Kiln,
	[BuildingTypes.SAWMILL]: Sawmill,
	[BuildingTypes.MINE]: Mine,
	[BuildingTypes.CAMPFIRE]: Campfire,
	[BuildingTypes.CACHE]: Cache,
	[BuildingTypes.WAREHOUSE]: Warehouse,
	[BuildingTypes.WALL]: Wall,
	[BuildingTypes.LIBRARY]: Library
} as const

const buildingMetaCache = new Map<BuildingTypes, BuildingMeta>()

function buildEffect(type: BuildingTypes): string | undefined {
	switch (type) {
		case BuildingTypes.TENT:
			return `Loge ${Tent.capacity} citoyens (un logement évite la perte de point de vie). Logement de départ, évolue en Maison.`
		case BuildingTypes.HOUSE:
			return `Loge ${House.capacity} citoyens (un logement évite la perte de point de vie).`
		case BuildingTypes.CACHE:
			return 'Stocke et protège les ressources des événements. Indestructible. Évolue en Entrepôt.'
		case BuildingTypes.WAREHOUSE:
			return `Stocke et protège les ressources des événements (${Warehouse.STORAGE_MULTIPLIER}× la capacité d'une cache). Indestructible.`
		case BuildingTypes.WALL:
			return `Bloque une attaque entière, puis est détruite (nécessite ${Wall.minBuilders} bâtisseurs).`
		case BuildingTypes.MINE:
			return 'Produit de la pierre — production et capacité tirées au hasard à la construction. Unique : une seule mine à la fois, elle doit s’épuiser avant d’en creuser une nouvelle.'
		default:
			return undefined
	}
}

// Note générique d'évolution : « consomme N <bâtiment de base> à la construction ».
function buildUpgradeNote(type: BuildingTypes): string | undefined {
	const upgrade = getUpgradeRequirement(type)
	if (!upgrade) return undefined
	const baseName = buildingNames[upgrade.from]
	return `Évolution : consomme ${upgrade.amount} ${baseName}${upgrade.amount > 1 ? 's' : ''} au lancement du chantier.`
}

export function getBuildingMeta(type: BuildingTypes): BuildingMeta {
	const cached = buildingMetaCache.get(type)
	if (cached) return cached

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const Cls = BUILDING_CLASSES[type] as any
	const instance = new Cls(0)

	const meta: BuildingMeta = {
		type,
		outputResources: instance.outputResources ?? [],
		inputResources: instance.inputResources ?? [],
		operatingWorkers: instance.workerTypeRequired ?? [],
		buildWorkers: Cls.workerRequiredToBuild ?? [],
		constructionCosts: Cls.constructionCosts ?? [], // Mine hérite de [] (AbstractExtractionBuilding) : gratuite à construire
		timeToBuild: Cls.timeToBuild ?? 0,
		researchOutput: type === BuildingTypes.LIBRARY ? Library.researchOutput : undefined,
		housingCapacity:
			type === BuildingTypes.HOUSE
				? House.capacity
				: type === BuildingTypes.TENT
					? Tent.capacity
					: undefined,
		isExtraction: type === BuildingTypes.MINE,
		effect: buildEffect(type),
		upgradeNote: buildUpgradeNote(type)
	}

	buildingMetaCache.set(type, meta)
	return meta
}

export function getOccupationMeta(type: OccupationTypes): OccupationMeta {
	const retirement = RETIREMENT_AGE_BY_OCCUPATION[type] ?? 0
	return {
		minAge: MINIMAL_AGE_TO_BECOME[type] ?? 0,
		retirementAge: retirement > 0 ? retirement : null
	}
}
