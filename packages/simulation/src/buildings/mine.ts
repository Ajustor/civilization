import { OccupationTypes } from '../people/work/enum'
import { ResourceTypes } from '../resource'
import {
  AbstractExtractionBuilding,
  BuildingType,
  ExtractedResource,
  WorkerRequired,
  WorkerRequiredToBuild,
} from '../types/building'
import { getRandomInt } from '../utils/random'
import { BuildingTypes } from './enum'

export class Mine extends AbstractExtractionBuilding {
  workerTypeRequired: WorkerRequired[] = [
    { occupation: OccupationTypes.MINER, count: 10 },
  ]
  outputResources: ExtractedResource[] = []
  capacity = getRandomInt(1000, 100_000)
  public static workerRequiredToBuild: WorkerRequiredToBuild[] = [
    {
      occupation: OccupationTypes.GATHERER,
      amount: 5,
    },
  ]
  public static timeToBuild: number = 10

  getType(): BuildingTypes {
    return BuildingTypes.MINE
  }

  formatToType(): BuildingType {
    return {
      count: this.count,
      type: this.getType(),
      capacity: this.capacity,
      outputResources: this.outputResources,
    }
  }

  public generateOutput(possibleOutput: ResourceTypes[]) {
    let percent = 0
    for (const resource of possibleOutput) {
      if (percent === 100) {
        return
      }

      const currentPercent = getRandomInt(0, 100 - percent)
      percent += currentPercent

      this.outputResources.push({ resource, probability: currentPercent })
    }
  }
}
