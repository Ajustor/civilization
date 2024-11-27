import { OccupationTypes } from '../people/work/enum'

export const OCCUPATION_TREE: { [key in OccupationTypes]?: OccupationTypes[] } =
{
  [OccupationTypes.WOODCUTTER]: [
    OccupationTypes.CARPENTER,
    OccupationTypes.CHARCOAL_BURNER,
  ],
  [OccupationTypes.GATHERER]: [
    OccupationTypes.FARMER,
    OccupationTypes.MINER,
    OccupationTypes.KITCHEN_ASSISTANT,
  ],
  [OccupationTypes.CHILD]: [
    OccupationTypes.WOODCUTTER,
    OccupationTypes.GATHERER,
  ],
  [OccupationTypes.KITCHEN_ASSISTANT]: [OccupationTypes.COOK],
}
