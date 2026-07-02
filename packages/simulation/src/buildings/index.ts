import {
  AbstractExtractionBuilding,
  AbstractProductionBuilding,
  type Building,
} from '../types/building'

export const isExtractionOrProductionBuilding = (
  building: Building,
): building is AbstractExtractionBuilding | AbstractProductionBuilding =>
  'outputResources' in building

export { Cache } from './cache'
export { Warehouse } from './warehouse'
export { Farm } from './farm'
export { Kiln } from './kiln'
export { Mine } from './mine'
export { Sawmill } from './sawmill'
export { House } from './house'
export { Tent } from './tent'
export {
  BUILDING_UPGRADES,
  getUpgradeRequirement,
  getUpgradeTarget,
} from './upgrades'
export type { BuildingUpgradeRequirement } from './upgrades'
export { Campfire } from './campfire'
export { Wall } from './wall'
export { Library } from './library'
