import { OccupationTypes } from '../people/work/enum'

export const OCCUPATION_TREE: { [key in OccupationTypes]?: OccupationTypes[] } =
  {
    [OccupationTypes.WOODCUTTER]: [
      OccupationTypes.CARPENTER,
      OccupationTypes.CHARCOAL_BURNER,
    ],
    [OccupationTypes.GATHERER]: [OccupationTypes.FARMER, OccupationTypes.MINER],
    [OccupationTypes.CHILD]: [
      OccupationTypes.WOODCUTTER,
      OccupationTypes.GATHERER,
    ],
  }
