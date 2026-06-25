import { BuildingTypes } from '@ajustor/simulation'

export const buildingNames: { [key in BuildingTypes]: string } = {
  [BuildingTypes.HOUSE]: 'Maison',
  [BuildingTypes.FARM]: 'Ferme',
  [BuildingTypes.KILN]: 'Four à chaux',
  [BuildingTypes.SAWMILL]: 'Scierie',
  [BuildingTypes.MINE]: 'Mine',
  [BuildingTypes.CAMPFIRE]: 'Feu de camp',
  [BuildingTypes.CACHE]: 'Entrepôt',
  [BuildingTypes.WALL]: 'Muraille',
}
