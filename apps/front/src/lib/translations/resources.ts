import type { ResourceTypes } from '@ajustor/simulation'
import { getIcon } from '@iconify/svelte'

export const resourceNames: { [key in ResourceTypes]: string } = {
  food: 'Nourriture',
  wood: 'Bois',
  stone: 'Pierre',
  plank: 'Planche',
  charcoal: 'Charbon'
}

export const resourceIcons: { [key in ResourceTypes]: any } = {
  food: getIcon('game-icon:carrot'),
  wood: getIcon('game-icon:wood-pile'),
  stone: getIcon('game-icon:stone-block'),
  plank: getIcon('game-icons:planks'),
  charcoal: getIcon('game-icon:charcoal')
}
