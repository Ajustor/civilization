import { OccupationTypes } from '@ajustor/simulation'

export const OCCUPATIONS: { [key in OccupationTypes]: string } = {
  [OccupationTypes.FARMER]: 'Fermier',
  [OccupationTypes.CARPENTER]: 'Charpentier',
  [OccupationTypes.RETIRED]: 'Retraité',
  [OccupationTypes.CHARCOAL_BURNER]: 'Charbonnier',
  [OccupationTypes.GATHERER]: 'Récolteur',
  [OccupationTypes.WOODCUTTER]: 'Coupeur de bois',
  [OccupationTypes.CHILD]: 'Enfant',
  [OccupationTypes.MINER]: 'Mineur',
  [OccupationTypes.KITCHEN_ASSISTANT]: 'Commis de cuisine'
}
