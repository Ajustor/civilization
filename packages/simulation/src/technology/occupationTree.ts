import { OccupationTypes } from '../people/work/enum'

export const OCCUPATION_TREE: { [key in OccupationTypes]?: OccupationTypes[] } = {
  [OccupationTypes.WOOD_CUTTER]: [
    OccupationTypes.CARPENTER,
    OccupationTypes.CHARCOAL_BURNER
  ],
  [OccupationTypes.FARMER]: []
}