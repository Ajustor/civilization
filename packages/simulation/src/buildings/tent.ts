import type {
  Building,
  BuildingType,
  ConstructionCost,
  WorkerRequiredToBuild
} from '../types/building';

import { ResourceTypes } from "../resource";
import { BuildingTypes } from "./enum";
import { House } from "./house";

// Logement de départ : une tente couvre la moitié des apports d'une maison
// (capacité dérivée de House pour que le ratio reste vrai si la maison change)
// et sert de base à son évolution — voir BUILDING_UPGRADES.
export class Tent implements Building {
  static capacity = House.capacity / 2;
  public static timeToBuild: number = 1;

  public static workerRequiredToBuild: WorkerRequiredToBuild[] = [];

  constructor(public count = 0) {}

  public static constructionCosts: ConstructionCost[] = [
    {
      resource: ResourceTypes.WOOD,
      amount: 8,
    },
  ];

  getType() {
    return BuildingTypes.TENT;
  }

  formatToType(): BuildingType {
    return {
      capacity: Tent.capacity * this.count,
      type: this.getType(),
      count: this.count,
    };
  }
}
