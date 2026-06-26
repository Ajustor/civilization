import type {
  Building,
  BuildingType,
  ConstructionCost,
  WorkerRequiredToBuild
} from '../types/building';

import { ResourceTypes } from "../resource";
import { BuildingTypes } from "./enum";

export class House implements Building {
  static capacity = 4;
  public static timeToBuild: number = 2;

  public static workerRequiredToBuild: WorkerRequiredToBuild[] = [];

  constructor(public count = 0) {}

  public static constructionCosts: ConstructionCost[] = [
    {
      resource: ResourceTypes.WOOD,
      amount: 15,
    },
  ];

  getType() {
    return BuildingTypes.HOUSE;
  }

  formatToType(): BuildingType {
    return {
      capacity: House.capacity * this.count,
      type: this.getType(),
      count: this.count,
    };
  }
}
