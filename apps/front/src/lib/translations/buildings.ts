import { BuildingTypes } from '@ajustor/simulation'

export const buildingNames: { [key in BuildingTypes]: string } = {
  [BuildingTypes.TENT]: 'Tente',
  [BuildingTypes.HOUSE]: 'Maison',
  [BuildingTypes.FARM]: 'Ferme',
  [BuildingTypes.KILN]: 'Four à chaux',
  [BuildingTypes.SAWMILL]: 'Scierie',
  [BuildingTypes.MINE]: 'Mine',
  [BuildingTypes.CAMPFIRE]: 'Feu de camp',
  [BuildingTypes.CACHE]: 'Cache',
  [BuildingTypes.WAREHOUSE]: 'Entrepôt',
  [BuildingTypes.WALL]: 'Muraille',
  [BuildingTypes.LIBRARY]: 'Bibliothèque',
}
