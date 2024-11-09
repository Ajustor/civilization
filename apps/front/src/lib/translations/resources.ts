import type { ResourceTypes } from '@ajustor/simulation'

export const resourceNames: { [key in ResourceTypes]: string } = {
  food: 'Nourriture',
  wood: 'Bois',
  stone: 'Pierre',
  plank: 'Planche',
  charcoal: 'Charbon'
}

export const resourceIcons: { [key in ResourceTypes]: any } = {
  food: 'lucide:carrot',
  wood: 'game-icons:wood-pile',
  stone: 'game-icons:stone-block',
  plank: 'game-icons:planks',
  charcoal: 'game-icons:coal-pile'
}
