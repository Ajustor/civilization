import { BuildingTypes } from './enum'

// Système générique d'évolution de bâtiments.
//
// Un bâtiment « évolué » déclare ici le bâtiment de base qu'il remplace :
// lancer son chantier consomme `amount` exemplaire(s) du bâtiment `from`
// (en plus des coûts en ressources et du déblocage éventuel par une
// recherche, déclaré comme d'habitude via l'effet `unlockBuilding` de
// l'arbre technologique). Pour créer une nouvelle filière d'évolution, il
// suffit d'ajouter une entrée ici.
export type BuildingUpgradeRequirement = {
  from: BuildingTypes
  amount: number
}

export const BUILDING_UPGRADES: {
  [key in BuildingTypes]?: BuildingUpgradeRequirement
} = {
  [BuildingTypes.HOUSE]: { from: BuildingTypes.TENT, amount: 1 },
  [BuildingTypes.WAREHOUSE]: { from: BuildingTypes.CACHE, amount: 2 },
}

// Le prérequis d'évolution d'un bâtiment, ou undefined s'il se construit ex nihilo.
export const getUpgradeRequirement = (
  building: BuildingTypes,
): BuildingUpgradeRequirement | undefined => BUILDING_UPGRADES[building]

// Le bâtiment évolué obtenu à partir d'un bâtiment de base, s'il existe.
export const getUpgradeTarget = (
  from: BuildingTypes,
): BuildingTypes | undefined => {
  for (const [target, requirement] of Object.entries(BUILDING_UPGRADES)) {
    if (requirement.from === from) {
      return target as BuildingTypes
    }
  }
  return undefined
}
