import { OccupationTypes } from "../people/work/enum";
import { ResourceTypes } from "../resource";
import {
  AbstractStorageBuilding, type BuildingType, type ConstructionCost, type StoredResource, type WorkerRequiredToBuild
} from "../types/building";
import { Cache } from "./cache";
import { BuildingTypes } from "./enum";

// Évolution de la Cache (voir BUILDING_UPGRADES : 2 caches consommées par
// entrepôt). Stocke 3× plus que la cache — capacités dérivées de Cache pour
// que le ratio reste vrai si celle-ci change.
export class Warehouse extends AbstractStorageBuilding {
  static readonly STORAGE_MULTIPLIER = 3;

  constructor(public count = 1) {
    super();
  }

  storedResources: StoredResource[] = new Cache().storedResources.map(
    ({ resource, maxQuantity }) => ({
      resource,
      maxQuantity: maxQuantity * Warehouse.STORAGE_MULTIPLIER,
    }),
  );

  public static timeToBuild = 8;

  public static constructionCosts: ConstructionCost[] = [
    { amount: 40, resource: ResourceTypes.WOOD },
    { amount: 30, resource: ResourceTypes.PLANK },
  ];

  public static workerRequiredToBuild: WorkerRequiredToBuild[] = [
    {
      occupation: OccupationTypes.BUILDER,
      amount: 6,
    },
  ];

  getType(): BuildingTypes {
    return BuildingTypes.WAREHOUSE;
  }

  formatToType(): BuildingType {
    return {
      count: this.count,
      type: this.getType(),
    };
  }
}
