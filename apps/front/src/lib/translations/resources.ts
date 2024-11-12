import { ResourceTypes } from '@ajustor/simulation'

export const resourceNames: { [key in ResourceTypes]: string } = {
  [ResourceTypes.RAW_FOOD]: 'Nourriture',
  [ResourceTypes.WOOD]: 'Bois',
  [ResourceTypes.STONE]: 'Pierre',
  [ResourceTypes.PLANK]: 'Planche',
  [ResourceTypes.CHARCOAL]: 'Charbon',
  [ResourceTypes.COOKED_FOOD] : 'Nourriture préparée'
}

export const resourceIcons: { [key in ResourceTypes]: any } = {
  [ResourceTypes.RAW_FOOD]: 'lucide:carrot',
  [ResourceTypes.WOOD]: 'game-icons:wood-pile',
  [ResourceTypes.STONE]: 'game-icons:stone-block',
  [ResourceTypes.PLANK]: 'game-icons:planks',
  [ResourceTypes.CHARCOAL]: 'game-icons:coal-pile',
  [ResourceTypes.COOKED_FOOD]: 'game-icons:opened-food-can',
}
