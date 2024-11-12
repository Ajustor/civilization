import { AbstractExtractionBuilding, AbstractProductionBuilding, Building } from "../types/building"

export const isExtractionOrProductionBuilding = (building: Building): building is AbstractExtractionBuilding | AbstractProductionBuilding => 'outputResources' in building

export { Farm } from './farm'
export { Kiln } from './kiln'
export { Mine } from './mine'
export { Sawmill } from './sawmill'
export { House } from './house'
export { Campfire } from './campfire'
