import { OccupationTypes } from "../people/work/enum";
import { ResourceTypes } from "../resource";
import {
  AbstractStorageBuilding, type BuildingType, type ConstructionCost, type StoredResource, type WorkerRequiredToBuild
} from "../types/building";
import { BuildingTypes } from "./enum";

export class Cache extends AbstractStorageBuilding {
  // Le count doit venir du constructeur : l'ignorer ferait retomber les caches
  // empilées à 1 au rechargement depuis la base (et l'évolution en Entrepôt
  // exige 2 caches debout).
  constructor(public count = 1) {
    super();
  }

  storedResources: StoredResource[] = [
    {
      resource: ResourceTypes.WOOD,
      maxQuantity: 150,
    },
    {
      resource: ResourceTypes.RAW_FOOD,
      maxQuantity: 300,
    },
    {
      resource: ResourceTypes.COOKED_FOOD,
      maxQuantity: 100,
    },
    {
      resource: ResourceTypes.CHARCOAL,
      maxQuantity: 150,
    },
    {
      resource: ResourceTypes.PLANK,
      maxQuantity: 150,
    },
    {
      resource: ResourceTypes.STONE,
      maxQuantity: 300,
    },
  ];

  public static timeToBuild = 6;

  // Aligné sur les autres bâtiments (10-25 ressources, ~2 ouvriers), avec un
  // léger premium : l'entrepôt est indestructible et protège les ressources.
  // Les planches maintiennent le prérequis implicite d'une scierie en activité.
  public static constructionCosts: ConstructionCost[] = [
    { amount: 30, resource: ResourceTypes.WOOD },
    { amount: 20, resource: ResourceTypes.PLANK },
  ];

  public static workerRequiredToBuild: WorkerRequiredToBuild[] = [
    {
      occupation: OccupationTypes.BUILDER,
      amount: 4,
    },
  ];

  getType(): BuildingTypes {
    return BuildingTypes.CACHE;
  }

  formatToType(): BuildingType {
    return {
      count: this.count,
      type: this.getType(),
    };
  }
}
