import {
  AbstractExtractionBuilding,
  AbstractProductionBuilding,
  Building,
} from '../types/building'

export const isExtractionOrProductionBuilding = (
  building: Building,
): building is AbstractExtractionBuilding | AbstractProductionBuilding =>
  'outputResources' in building

import { Cache } from './cache'
import { Farm } from './farm'
import { Kiln } from './kiln'
import { Mine } from './mine'
import { Sawmill } from './sawmill'
import { House } from './house'
import { Campfire } from './campfire'
import { OutdoorKitchen } from './outdoorKitchen'

export type AnyBuilding =
  | Cache
  | Farm
  | Kiln
  | Mine
  | Sawmill
  | House
  | Campfire
  | OutdoorKitchen
export { Cache, Farm, Kiln, Mine, Sawmill, House, Campfire, OutdoorKitchen }
