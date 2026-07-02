import type { Civilization } from '../civilization'
import { BuildingTypes } from '../buildings/enum'
import { OccupationTypes } from '../people/work/enum'
import { LIFE_EXPECTANCY } from '../people/people'
import { ResourceTypes } from '../resource'
import { TECH_TREE } from '../technology/techTree'

export enum AchievementId {
  // Population
  POPULATION_100 = 'population_100',
  POPULATION_250 = 'population_250',
  POPULATION_500 = 'population_500',
  POPULATION_1000 = 'population_1000',
  // Longévité
  DECADE = 'decade',
  CENTURY = 'century',
  MILLENNIUM = 'millennium',
  // Science
  FIRST_TECH = 'first_tech',
  TECHS_10 = 'techs_10',
  TECHS_30 = 'techs_30',
  FULL_TREE = 'full_tree',
  // Bâtiments
  BUILDINGS_10 = 'buildings_10',
  LIBRARIES_5 = 'libraries_5',
  // Armée
  SOLDIERS_10 = 'soldiers_10',
  FIRST_VICTORY = 'first_victory',
  // Ressources
  FOOD_10K = 'food_10k',
  WEALTH_50K = 'wealth_50k',
  // Population remarquable
  ELDER = 'elder',
  // Expansion
  FIRST_COLONY = 'first_colony',
}

export type AchievementNode = {
  id: AchievementId
  name: string
  description: string
  emblem: string
  points: number
  // Évalué chaque mois sur l'état de la civilisation ; un succès débloqué reste
  // acquis même si la condition cesse d'être vraie. Absent pour les succès
  // événementiels (première victoire, première colonie), accordés directement
  // par le moteur au moment du fait.
  isUnlocked?: (civilization: Civilization) => boolean
}

const totalBuildings = (civilization: Civilization): number =>
  civilization.buildings.reduce((sum, building) => sum + building.count, 0)

const totalResources = (civilization: Civilization): number =>
  Object.values(ResourceTypes).reduce(
    (sum, type) => sum + (civilization.getResource(type)?.quantity ?? 0),
    0,
  )

export const ACHIEVEMENTS: AchievementNode[] = [
  // ── Population ──────────────────────────────────────────────────
  {
    id: AchievementId.POPULATION_100,
    name: 'Hameau',
    description: 'Atteindre 100 habitants.',
    emblem: '🏕️',
    points: 10,
    isUnlocked: (civilization) => civilization.people.length >= 100,
  },
  {
    id: AchievementId.POPULATION_250,
    name: 'Bourg',
    description: 'Atteindre 250 habitants.',
    emblem: '🏘️',
    points: 20,
    isUnlocked: (civilization) => civilization.people.length >= 250,
  },
  {
    id: AchievementId.POPULATION_500,
    name: 'Ville',
    description: 'Atteindre 500 habitants.',
    emblem: '🏙️',
    points: 40,
    isUnlocked: (civilization) => civilization.people.length >= 500,
  },
  {
    id: AchievementId.POPULATION_1000,
    name: 'Métropole',
    description: 'Atteindre 1 000 habitants.',
    emblem: '🌆',
    points: 80,
    isUnlocked: (civilization) => civilization.people.length >= 1000,
  },

  // ── Longévité ───────────────────────────────────────────────────
  {
    id: AchievementId.DECADE,
    name: 'Fondations solides',
    description: 'Survivre 10 ans.',
    emblem: '🌱',
    points: 10,
    isUnlocked: (civilization) => civilization.livedMonths >= 10 * 12,
  },
  {
    id: AchievementId.CENTURY,
    name: 'Centenaire',
    description: 'Survivre 100 ans.',
    emblem: '🌳',
    points: 30,
    isUnlocked: (civilization) => civilization.livedMonths >= 100 * 12,
  },
  {
    id: AchievementId.MILLENNIUM,
    name: 'Millénaire',
    description: 'Survivre 1 000 ans.',
    emblem: '🏛️',
    points: 100,
    isUnlocked: (civilization) => civilization.livedMonths >= 1000 * 12,
  },

  // ── Science ─────────────────────────────────────────────────────
  {
    id: AchievementId.FIRST_TECH,
    name: 'Premier savoir',
    description: 'Débloquer une première technologie.',
    emblem: '📜',
    points: 10,
    isUnlocked: (civilization) => civilization.researchedTechs.length >= 1,
  },
  {
    id: AchievementId.TECHS_10,
    name: 'Lettrés',
    description: 'Débloquer 10 technologies.',
    emblem: '📚',
    points: 20,
    isUnlocked: (civilization) => civilization.researchedTechs.length >= 10,
  },
  {
    id: AchievementId.TECHS_30,
    name: 'Siècle des Lumières',
    description: 'Débloquer 30 technologies.',
    emblem: '🔬',
    points: 50,
    isUnlocked: (civilization) => civilization.researchedTechs.length >= 30,
  },
  {
    id: AchievementId.FULL_TREE,
    name: 'Esprit universel',
    description: "Débloquer l'intégralité de l'arbre technologique.",
    emblem: '🌟',
    points: 150,
    isUnlocked: (civilization) =>
      civilization.researchedTechs.length >= TECH_TREE.length,
  },

  // ── Bâtiments ───────────────────────────────────────────────────
  {
    id: AchievementId.BUILDINGS_10,
    name: 'Bâtisseurs',
    description: 'Posséder 10 bâtiments.',
    emblem: '🧱',
    points: 15,
    isUnlocked: (civilization) => totalBuildings(civilization) >= 10,
  },
  {
    id: AchievementId.LIBRARIES_5,
    name: 'Grande Bibliothèque',
    description: 'Posséder 5 bibliothèques.',
    emblem: '🏫',
    points: 30,
    isUnlocked: (civilization) =>
      civilization.buildings
        .filter((building) => building.getType() === BuildingTypes.LIBRARY)
        .reduce((sum, building) => sum + building.count, 0) >= 5,
  },

  // ── Armée ───────────────────────────────────────────────────────
  {
    id: AchievementId.SOLDIERS_10,
    name: 'Garnison',
    description: 'Entretenir 10 soldats en même temps.',
    emblem: '🛡️',
    points: 15,
    isUnlocked: (civilization) =>
      civilization.getPeopleWithOccupation(OccupationTypes.SOLDIER).length >= 10,
  },
  {
    id: AchievementId.FIRST_VICTORY,
    name: 'Premier triomphe',
    description: 'Remporter une bataille contre une autre civilisation.',
    emblem: '⚔️',
    points: 40,
  },

  // ── Ressources ──────────────────────────────────────────────────
  {
    id: AchievementId.FOOD_10K,
    name: 'Greniers pleins',
    description: 'Stocker 10 000 nourritures (brute et préparée cumulées).',
    emblem: '🌾',
    points: 20,
    isUnlocked: (civilization) =>
      (civilization.getResource(ResourceTypes.RAW_FOOD)?.quantity ?? 0) +
        (civilization.getResource(ResourceTypes.COOKED_FOOD)?.quantity ?? 0) >=
      10_000,
  },
  {
    id: AchievementId.WEALTH_50K,
    name: 'Prospérité',
    description: 'Stocker 50 000 ressources toutes catégories confondues.',
    emblem: '💰',
    points: 40,
    isUnlocked: (civilization) => totalResources(civilization) >= 50_000,
  },

  // ── Population remarquable ──────────────────────────────────────
  {
    id: AchievementId.ELDER,
    name: 'Sagesse des anciens',
    description: `Compter un citoyen de ${LIFE_EXPECTANCY} ans ou plus.`,
    emblem: '🧓',
    points: 15,
    isUnlocked: (civilization) =>
      civilization.people.some((person) => person.years >= LIFE_EXPECTANCY),
  },

  // ── Expansion ───────────────────────────────────────────────────
  {
    id: AchievementId.FIRST_COLONY,
    name: 'Nouveau monde',
    description: 'Fonder une première colonie.',
    emblem: '🌍',
    points: 50,
  },
]

export const getAchievement = (
  id: AchievementId | string,
): AchievementNode | undefined =>
  ACHIEVEMENTS.find((achievement) => achievement.id === id)

// Score maximal théorique, utile pour afficher une progression.
export const ACHIEVEMENTS_MAX_SCORE = ACHIEVEMENTS.reduce(
  (sum, achievement) => sum + achievement.points,
  0,
)

// Somme des points d'une liste de succès débloqués (les ids inconnus — succès
// retirés du catalogue — sont ignorés).
export const computeAchievementScore = (
  unlockedIds: readonly string[],
): number =>
  unlockedIds.reduce(
    (sum, id) => sum + (getAchievement(id)?.points ?? 0),
    0,
  )

// Succès « d'état » nouvellement mérités : condition vraie et pas encore acquis.
export const evaluateAchievements = (
  civilization: Civilization,
  alreadyUnlocked: Iterable<string> = [],
): AchievementNode[] => {
  const owned = new Set(alreadyUnlocked)
  return ACHIEVEMENTS.filter(
    (achievement) =>
      !owned.has(achievement.id) &&
      achievement.isUnlocked?.(civilization) === true,
  )
}
