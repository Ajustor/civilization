import { countries, uniqueNamesGenerator } from "unique-names-generator";
import { v4 } from "uuid";

import { isExtractionOrProductionBuilding } from "./buildings";
import { Cache } from "./buildings/cache";
import { Campfire } from "./buildings/campfire";
import { BuildingTypes } from "./buildings/enum";
import { Farm } from "./buildings/farm";
import { House } from "./buildings/house";
import { Kiln } from "./buildings/kiln";
import { Library } from "./buildings/library";
import { Mine } from "./buildings/mine";
import { Sawmill } from "./buildings/sawmill";
import { Wall } from "./buildings/wall";
import { Gender } from "./people/enum";
import { People, MAX_NUMBER_OF_CHILD } from "./people/people";
import { DeathCause, type DeathRecord } from "./people/death";
import { OccupationTypes } from "./people/work/enum";
import { MINIMAL_AGE_TO_BECOME } from "./people/work/ages";
import { Resource, ResourceTypes } from "./resource";
import { OCCUPATION_TREE } from "./technology/occupationTree";
import { TechId, getTechNode, getBuildingGate } from "./technology/techTree";
import { Events } from "./events/enum";
import {
  AbstractExtractionBuilding, AbstractStorageBuilding, type Building, type ConstructionCost,
  type ExtractionBuilding, type ProductionBuilding, type WorkerRequiredToBuild
} from "./types/building";
import { isWithinChance } from "./utils";
import { hasElementInCommon } from "./utils/array";
import { getRandomInt } from "./utils/random";

import type { World } from './world';
import type { CivilizationConfig, PendingConstruction } from './types/civilization';

export const defaultCivilizationConfig: CivilizationConfig = {
  PEOPLE_CHARCOAL_CAN_HEAT: 10,
  MAX_ACTIVE_PEOPLE_BY_CIVILIZATION: 100_000,
  PREGNANCY_PROBABILITY: 60,
  CHANCE_TO_BUILD_EVOLVED_BUILDING: 25,
  CHANCE_TO_EVOLVE: 20,
  MAXIMUM_CHILDREN_PERCENTAGE: 25,
  OPEN_EXCHANGE: [],
  AT_WAR_WITH: [],
  MILITARY_RATIO: 0,
  NEXT_BUILDING_TO_BUILD: null,
  SPEED_MODE: false,
};

const BUILDING_CONSTRUCTORS = {
  [BuildingTypes.FARM]: Farm,
  [BuildingTypes.KILN]: Kiln,
  [BuildingTypes.HOUSE]: House,
  [BuildingTypes.SAWMILL]: Sawmill,
  [BuildingTypes.CAMPFIRE]: Campfire,
  [BuildingTypes.MINE]: Mine,
  [BuildingTypes.CACHE]: Cache,
  [BuildingTypes.WALL]: Wall,
  [BuildingTypes.LIBRARY]: Library,
};

const UNDESTRUCTIBLE_BUILDINGS = [BuildingTypes.CACHE];

const EXTRACTIONS_RESOURCES: { [key in BuildingTypes]?: ResourceTypes[] } = {
  [BuildingTypes.MINE]: [ResourceTypes.STONE],
};

const STORAGE_BUILDINGS = [BuildingTypes.CACHE];
const EXTRACTIONS_BUILDINGS = [BuildingTypes.MINE];

export const isExtractionBuilding = (
  building: Building,
): building is AbstractExtractionBuilding =>
  EXTRACTIONS_BUILDINGS.includes(building.getType());

export class Civilization {
  public id = v4();
  public pendingConstructions: PendingConstruction[] = [];
  private _people: People[];
  private _resources: Resource[];
  private _livedMonths: number = 0;
  private _researchPoints: number = 0;
  private _researchedTechs: TechId[] = [];
  private _buildings: Building[];
  private _citizensCount: number = 0;
  // Deaths collected during the current month (war casualties + natural deaths),
  // read back after passAMonth to fill the cemetery. Per-instance and transient.
  private _deaths: DeathRecord[] = [];
  private _occupationIndex: Map<OccupationTypes, People[]> | null = null;
  private _techCache: {
    production: number
    storage: number
    military: number
    maxChildren: number
    pregnancyBonus: number
    research: number
    eventReductions: Map<Events, number>
  } | null = null;

  constructor(
    public name = uniqueNamesGenerator({ dictionaries: [countries] }),
    public config: CivilizationConfig = {
      ...defaultCivilizationConfig,
      OPEN_EXCHANGE: [...defaultCivilizationConfig.OPEN_EXCHANGE],
      AT_WAR_WITH: [...defaultCivilizationConfig.AT_WAR_WITH],
    },
  ) {
    this._people = [];
    this._resources = [];
    this._buildings = [];
  }

  nobodyAlive(): boolean {
    return this._people.length === 0;
  }

  get citizensCount(): number {
    return this._people.length || this._citizensCount;
  }

  set citizensCount(citizenCount: number) {
    this._citizensCount = citizenCount;
  }

  get childrenCount(): number {
    return this.people.filter((person) => person.work?.occupationType === OccupationTypes.CHILD).length;
  }

  // Adults = every living citizen who is not a child (workers, retired,
  // soldiers, érudits…).
  get adultsCount(): number {
    return this.people.filter((person) => person.work?.occupationType !== OccupationTypes.CHILD).length;
  }

  // Maximum number of simultaneous children, derived as a percentage of the
  // adult population (config MAXIMUM_CHILDREN_PERCENTAGE). Rounded up so a small
  // population (e.g. a fresh colony of a couple of adults) is never sterilised
  // by flooring to zero, while still scaling proportionally with the civ.
  get maxChildren(): number {
    const percentage = this.config.MAXIMUM_CHILDREN_PERCENTAGE ?? 0;
    return Math.ceil((this.adultsCount * percentage) / 100);
  }

  get livedMonths(): number {
    return this._livedMonths;
  }

  // Deaths recorded since this instance was loaded (one month's worth in the
  // monthly tick, since civilizations are reloaded fresh each month).
  get deaths(): DeathRecord[] {
    return this._deaths;
  }

  set livedMonths(livedMonths: number) {
    this._livedMonths = livedMonths;
  }

  get researchPoints(): number {
    return this._researchPoints;
  }

  set researchPoints(value: number) {
    this._researchPoints = value;
  }

  get researchedTechs(): TechId[] {
    return this._researchedTechs;
  }

  set researchedTechs(value: TechId[]) {
    this._researchedTechs = value;
    this._techCache = null;
  }

  hasTech(id: TechId): boolean {
    return this._researchedTechs.includes(id);
  }

  canUnlock(id: TechId): boolean {
    const node = getTechNode(id);
    if (!node || this.hasTech(id)) {
      return false;
    }
    return node.prerequisites.every((pre) => this.hasTech(pre));
  }

  isBuildingUnlocked(building: BuildingTypes): boolean {
    const gate = getBuildingGate(building);
    return gate === undefined || this.hasTech(gate);
  }

  private buildTechCache(): void {
    let production = 1, storage = 1, military = 1, research = 1
    let maxChildren = 0, pregnancyBonus = 0
    const eventReductions = new Map<Events, number>()
    for (const id of this._researchedTechs) {
      for (const effect of getTechNode(id)?.effects ?? []) {
        switch (effect.kind) {
          case 'productionMultiplier': production *= effect.factor; break
          case 'storageMultiplier': storage *= effect.factor; break
          case 'militaryMultiplier': military *= effect.factor; break
          case 'maxChildrenBonus': maxChildren += effect.amount; break
          case 'pregnancyProbabilityBonus': pregnancyBonus += effect.amount; break
          case 'researchMultiplier': research *= effect.factor; break
          case 'eventDamageReduction': {
            const current = eventReductions.get(effect.event) ?? 0
            // Combine reductions additively, capped at 90%
            eventReductions.set(effect.event, Math.min(0.9, current + effect.factor))
            break
          }
        }
      }
    }
    this._techCache = { production, storage, military, maxChildren, pregnancyBonus, research, eventReductions }
  }

  getEventDamageReduction(event: Events): number {
    if (!this._techCache) this.buildTechCache()
    return this._techCache!.eventReductions.get(event) ?? 0
  }

  private buildOccupationIndex(): void {
    const index = new Map<OccupationTypes, People[]>()
    for (const person of this._people) {
      if (!person.work) continue
      const occ = person.work.occupationType
      const bucket = index.get(occ)
      if (bucket) {
        bucket.push(person)
      } else {
        index.set(occ, [person])
      }
    }
    this._occupationIndex = index
  }

  get productionMultiplier(): number {
    if (!this._techCache) this.buildTechCache()
    return this._techCache!.production
  }

  get storageMultiplier(): number {
    if (!this._techCache) this.buildTechCache()
    return this._techCache!.storage
  }

  get militaryMultiplier(): number {
    if (!this._techCache) this.buildTechCache()
    return this._techCache!.military
  }

  get maxChildrenBonus(): number {
    if (!this._techCache) this.buildTechCache()
    return this._techCache!.maxChildren
  }

  get pregnancyProbabilityBonus(): number {
    if (!this._techCache) this.buildTechCache()
    return this._techCache!.pregnancyBonus
  }

  get researchMultiplier(): number {
    if (!this._techCache) this.buildTechCache()
    return this._techCache!.research
  }

  get people(): People[] {
    return this._people;
  }

  set people(people: People[]) {
    this._people = people;
  }

  get resources(): Resource[] {
    return this._resources;
  }

  set resources(resources: Resource[]) {
    this._resources = resources;
  }

  get buildings(): Building[] {
    return this._buildings;
  }

  get houses(): House | undefined {
    return this.buildings.find<House>(
      (building): building is House =>
        building.getType() === BuildingTypes.HOUSE,
    );
  }

  get sawmill(): Sawmill | undefined {
    return this.buildings.find<Sawmill>(
      (building): building is Sawmill =>
        building.getType() === BuildingTypes.SAWMILL,
    );
  }

  get mine(): Mine | undefined {
    return this.buildings.find<Mine>(
      (building): building is Mine => building.getType() === BuildingTypes.MINE,
    );
  }

  get kiln(): Kiln | undefined {
    return this.buildings.find<Kiln>(
      (building): building is Kiln => building.getType() === BuildingTypes.KILN,
    );
  }

  get farm(): Farm | undefined {
    return this.buildings.find<Farm>(
      (building): building is Farm => building.getType() === BuildingTypes.FARM,
    );
  }

  get cache(): Cache | undefined {
    return this.buildings.find<Cache>(
      (building): building is Cache =>
        building.getType() === BuildingTypes.CACHE,
    );
  }

  get campfire(): Campfire | undefined {
    return this.buildings.find<Campfire>(
      (building): building is Campfire =>
        building.getType() === BuildingTypes.CAMPFIRE,
    );
  }

  get library(): Library | undefined {
    return this.buildings.find<Library>(
      (building): building is Library =>
        building.getType() === BuildingTypes.LIBRARY,
    );
  }

  get wall(): Wall | undefined {
    return this.buildings.find<Wall>(
      (building): building is Wall => building.getType() === BuildingTypes.WALL,
    );
  }

  set houses(house: House) {
    this.buildings.push(house);
  }

  private getWorkerSpaceLeft(workerType: OccupationTypes): number {
    const peopleWithOccupation = this.getPeopleWithOccupation(workerType).length;
    return (
      this.buildings.reduce((space, building) => {
        if (isExtractionOrProductionBuilding(building)) {
          const requiredWorker = building.workerTypeRequired.filter(
            (worker) => worker.occupation === workerType,
          );
          if (!requiredWorker.length) {
            return space;
          }
          space +=
            requiredWorker.reduce((sum, { count }) => sum + count, 0) *
            building.count;
        }
        return space;
      }, 0) - peopleWithOccupation
    );
  }

  increaseResource(type: ResourceTypes, count: number) {
    const resource = this._resources.find((resource) => type === resource.type);
    if (!resource) {
      this._resources.push(new Resource(type, count));
    } else {
      resource.increase(count);
    }
  }

  decreaseResource(type: ResourceTypes, count: number) {
    const resource = this._resources.find((resource) => type === resource.type);

    if (!resource) {
      this._resources.push(new Resource(type, 0));
    } else {
      resource.decrease(count);
    }
  }

  getResource(type: ResourceTypes): Resource {
    let resource = this._resources.find((resource) => resource.type === type);

    if (!resource) {
      resource = new Resource(type, 0);
      this.addResource(resource);
    }

    return resource;
  }

  getPeopleWithOccupation(occupation: OccupationTypes): People[] {
    if (this._occupationIndex) {
      return this._occupationIndex.get(occupation) ?? []
    }
    return this._people.filter(
      ({ work: peopleJob }) =>
        peopleJob && occupation === peopleJob.occupationType,
    );
  }

  getPeopleOlderThan(age: number): People[] {
    return this._people.filter(({ years }) => years >= age);
  }

  removePeople(citizenIds: string[]) {
    this._people = this._people.filter(({ id }) => !citizenIds.includes(id));
  }

  getPeopleWithoutOccupation(occupation: OccupationTypes): People[] {
    return this._people.filter(
      ({ work: peopleJob }) =>
        peopleJob && occupation !== peopleJob.occupationType,
    );
  }

  get militaryStrength(): number {
    const base = this.getPeopleWithOccupation(OccupationTypes.SOLDIER).reduce(
      (strength, soldier) => strength + Math.max(0, soldier.lifeCounter),
      0,
    );
    return Math.floor(base * this.militaryMultiplier);
  }

  loseSoldiers(ratio: number): void {
    const soldiers = this.getPeopleWithOccupation(OccupationTypes.SOLDIER);
    const toKill = Math.floor(soldiers.length * ratio);
    const casualties = soldiers.slice(0, toKill);
    for (const soldier of casualties) {
      this._deaths.push({ name: soldier.name, cause: DeathCause.WAR });
    }
    this.removePeople(casualties.map(({ id }) => id));
  }

  releaseCaptives(count: number): People[] {
    const candidates = this.getPeopleWithoutOccupation(OccupationTypes.SOLDIER);
    const captured = candidates.slice(0, count);
    for (const captive of captured) {
      if (!captive.originCivilizationId) {
        captive.originCivilizationId = this.id;
      }
    }
    this.removePeople(captured.map(({ id }) => id));
    return captured;
  }

  getWorkersWhoCanRetire(): People[] {
    return this._people.filter((worker) => worker.canRetire());
  }

  getWorkersWhoCanUpgrade(): People[] {
    return this._people.filter(
      (worker) =>
        worker.work && OCCUPATION_TREE[worker.work.occupationType]?.length,
    );
  }

  getDestructibleBuildings(): Building[] {
    return this._buildings.filter(
      (building) => !UNDESTRUCTIBLE_BUILDINGS.includes(building.getType()),
    );
  }

  getStorageBuildings(): AbstractStorageBuilding[] {
    return this._buildings.filter((building) =>
      STORAGE_BUILDINGS.includes(building.getType()),
    ) as AbstractStorageBuilding[];
  }

  getStorageCapacity(resource: ResourceTypes): number {
    const base = this.getStorageBuildings().reduce((sum, building) => {
      const stored = building.storedResources.find((s) => s.resource === resource)
      return sum + (stored?.maxQuantity ?? 0) * building.count
    }, 0)
    return Math.floor(base * this.storageMultiplier)
  }

  // Per-woman lifetime child limit (people.ts MAX_NUMBER_OF_CHILD), raised by
  // the Medicine tech's maxChildrenBonus. The civilization-wide simultaneous cap
  // is a percentage of the adult population (config MAXIMUM_CHILDREN_PERCENTAGE,
  // via `maxChildren`) and is not affected by this bonus.
  get effectiveMaxChildrenPerWoman(): number {
    return MAX_NUMBER_OF_CHILD + this.maxChildrenBonus;
  }

  get effectivePregnancyProbability(): number {
    return Math.min(100, this.config.PREGNANCY_PROBABILITY + this.pregnancyProbabilityBonus);
  }

  addPeople(...peoples: People[]): void {
    for (const people of peoples) {
      this._people.push(people);
    }
  }

  addResource(...resources: Resource[]): void {
    this._resources.push(...resources);
  }

  addBuilding(...buildings: Building[]): void {
    this._buildings.push(...buildings);
  }

  removeBuilding(building: Building): void {
    this._buildings = this._buildings.filter(
      (existingBuilding) => existingBuilding !== building,
    );
  }

  constructBuilding(type: BuildingTypes): void {
    const existingBuilding = this.buildings.find(
      (building) => building.getType() === type,
    );

    if (!existingBuilding) {
      const newBuilding = new BUILDING_CONSTRUCTORS[type](1);

      if (isExtractionBuilding(newBuilding)) {
        const buildingType = newBuilding.getType();
        newBuilding.generateOutput(
          (buildingType in EXTRACTIONS_RESOURCES &&
            EXTRACTIONS_RESOURCES[buildingType]) ||
          [],
        );
      }
      this.addBuilding(newBuilding);
      return;
    }

    if (isExtractionBuilding(existingBuilding)) {
      const buildingType = existingBuilding.getType();
      existingBuilding.generateOutput(
        (buildingType in EXTRACTIONS_RESOURCES &&
          EXTRACTIONS_RESOURCES[buildingType]) ||
        [],
      );
    }

    existingBuilding.count++;
  }

  private startConstruction(buildingType: BuildingTypes, monthsToBuild: number): void {
    this.pendingConstructions.push({
      buildingType,
      monthsRemaining: monthsToBuild,
    });
  }

  private isBuildingPending(buildingType: BuildingTypes): boolean {
    return this.pendingConstructions.some(
      (pending) => pending.buildingType === buildingType,
    );
  }

  private progressConstructions(): void {
    const completed: PendingConstruction[] = [];
    for (const pending of this.pendingConstructions) {
      pending.monthsRemaining--;
      if (pending.monthsRemaining <= 0) {
        completed.push(pending);
      }
    }

    for (const pending of completed) {
      this.constructBuilding(pending.buildingType);
    }

    this.pendingConstructions = this.pendingConstructions.filter(
      (pending) => pending.monthsRemaining > 0,
    );
  }

  private collectResource(workers: People[], world: World): Promise<null> {
    return new Promise((resolve) => {
      for (const worker of workers) {
        worker.collectResource(world, this);
      }
      resolve(null);
    });
  }

  private async resourceConsumption(
    world: World,
    people: People[],
  ): Promise<void> {
    const civilizationFood = this.getResource(ResourceTypes.RAW_FOOD);
    const civilizationCookedFood = this.getResource(ResourceTypes.COOKED_FOOD);
    const civilizationWood = this.getResource(ResourceTypes.WOOD);
    const civilizationCharcoal = this.getResource(ResourceTypes.CHARCOAL);

    const foodPromise = new Promise((resolve) => {
      // Handle food consumption and life counter
      for (const person of people) {
        if (civilizationCookedFood) {
          const eatFactor = person.eatFactor;
          if (civilizationCookedFood.quantity >= eatFactor) {
            civilizationCookedFood.decrease(eatFactor);
            person.increaseLife(1);
            continue;
          }
        }

        if (civilizationFood) {
          const eatFactor = person.eatFactor * 2;
          if (civilizationFood.quantity >= eatFactor) {
            civilizationFood.decrease(eatFactor);
            person.increaseLife(0.5);
            continue;
          }
        }

        person.decreaseLife(4, DeathCause.STARVATION);
      }
      resolve(null);
    });

    const heatPromise = new Promise((resolve) => {
      // Handle wood consumption

      if (civilizationWood || civilizationCharcoal) {
        let requiredWoodQuantity = 0;

        switch (world.season) {
          case 'winter':
            requiredWoodQuantity = 3;
            break;
          case 'automn':
            requiredWoodQuantity = 2;
            break;
        }

        if (!requiredWoodQuantity) {
          resolve(null);
        }

        const peopleHeatedWithCharcoal = Math.min(
          civilizationCharcoal.quantity * this.config.PEOPLE_CHARCOAL_CAN_HEAT,
          people.length,
        );

        let peopleDoesNotHaveHeat = [...people];

        if (peopleHeatedWithCharcoal) {
          peopleDoesNotHaveHeat = people.toSpliced(0, peopleHeatedWithCharcoal);
          civilizationCharcoal.decrease(
            Math.ceil(
              (people.length - peopleDoesNotHaveHeat.length) /
              this.config.PEOPLE_CHARCOAL_CAN_HEAT,
            ),
          );
        }

        if (!peopleDoesNotHaveHeat.length) {
          return resolve(null);
        }

        for (const person of peopleDoesNotHaveHeat) {
          if (civilizationWood.quantity >= requiredWoodQuantity) {
            civilizationWood.decrease(requiredWoodQuantity);
          } else {
            person.decreaseLife(1, DeathCause.COLD);
          }
        }
      }
      resolve(null);
    });

    await Promise.all([foodPromise, heatPromise]);
  }

  async passAMonth(world: World): Promise<void> {
    // Handle resource collection
    this.buildOccupationIndex();

    const gatherers = this.getPeopleWithOccupation(OccupationTypes.GATHERER);
    const woodCutters = this.getPeopleWithOccupation(OccupationTypes.WOODCUTTER);
    const children = this.getPeopleWithOccupation(OccupationTypes.CHILD);

    await Promise.all([
      this.collectResource(children, world),
      this.collectResource(gatherers, world),
      this.collectResource(woodCutters, world),
    ]);

    const people = this.people
      .toSorted(
        (firstPerson, secondPerson) => secondPerson.years - firstPerson.years,
      )
      .toSorted((person) => (person.work?.canWork(person.years) ? 1 : -1));

    await this.resourceConsumption(world, people);

    // Age all people
    this._people.forEach((person) => person.ageOneMonth());

    this.checkHousing();
    this.removeDeadPeople();
    this.buildOccupationIndex();

    const activePeopleCount = this.people.filter(
      ({ work }) => work?.occupationType !== OccupationTypes.RETIRED,
    ).length;

    // The maximum number of simultaneous children is a percentage of the adult
    // population (config MAXIMUM_CHILDREN_PERCENTAGE), computed by `maxChildren`,
    // so it scales with the civilization. createNewPeople enforces the same cap
    // defensively.
    if (
      activePeopleCount < this.config.MAX_ACTIVE_PEOPLE_BY_CIVILIZATION &&
      this.childrenCount < this.maxChildren
    ) {
      await this.createNewPeople();
    }

    await this.birthAwaitingBabies();
    // Population settled — build index for extract/produce/research phase
    this.buildOccupationIndex();

    this.extractResources();
    this.produceResources();
    this.produceResearch();

    // adaptPeopleJob mutates occupations — clear the index so subsequent reads
    // fall back to the linear scan on the current (mutated) state
    this._occupationIndex = null;
    this.adaptPeopleJob();
    this.progressConstructions();
    this.buildNewBuilding(world);

    if (!this.nobodyAlive()) {
      this.livedMonths++;
    }
  }

  private useProductionBuilding(building: ProductionBuilding) {
    for (let i = building.count; i > 0; i--) {
      const requiredWorkers = building.workerTypeRequired;
      const workerByTypes = new Map<OccupationTypes, People[]>();
      const requiredResourceAmountIndexedByType = new Map<
        ResourceTypes,
        number
      >();

      const workerRequiredCount = requiredWorkers.reduce(
        (count, { count: amount }) => count + amount,
        0,
      );

      for (const requiredWorker of requiredWorkers) {
        const workers = this.getPeopleWithOccupation(
          requiredWorker.occupation,
        ).filter((people) => people.canWork());

        workerByTypes.set(
          requiredWorker.occupation,
          workers.splice(0, requiredWorker.count),
        );
      }

      for (const requiredResources of building.inputResources) {
        const resource = this.getResource(requiredResources.resource);

        if (resource.quantity < requiredResources.amount) {
          return;
        }

        requiredResourceAmountIndexedByType.set(
          requiredResources.resource,
          requiredResources.amount,
        );
      }
      let availableWorkers = 0;

      for (const workers of workerByTypes.values()) {
        for (const worker of workers) {
          worker.hasWork = true;

          availableWorkers++;
        }
      }
      const productionRatio = availableWorkers / workerRequiredCount;
      for (const [
        resource,
        amount,
      ] of requiredResourceAmountIndexedByType.entries()) {
        this.decreaseResource(resource, amount);
      }

      for (const producedResource of building.outputResources) {
        this.increaseResource(
          producedResource.resource,
          Math.ceil(producedResource.amount * productionRatio * this.productionMultiplier),
        );
      }
    }
  }

  private extractResources() {
    if (this.mine) {
      this.extractResourcesFromBuilding(this.mine);
    }
  }

  private extractResourcesFromBuilding(building: ExtractionBuilding) {
    const resourcesProbabilities = building.outputResources;
    const requiredWorkers = building.workerTypeRequired;

    // An exhausted extraction building is destroyed so a fresh one (with a new
    // random capacity) can be built in its place. `!= null` is used instead of
    // truthiness so that a capacity of exactly 0 is treated as exhausted.
    if (building.capacity != null && building.capacity <= 0) {
      this.removeBuilding(building);
      return;
    }

    for (const requiredWorker of requiredWorkers) {
      // The building employs up to `count` workers per unit built. Each working
      // miner gets an independent extraction roll, so output scales with the
      // size of the available workforce instead of a single token worker.
      const maxWorkers = requiredWorker.count * Math.max(building.count, 1);
      const availableWorkers = this.getPeopleWithOccupation(
        requiredWorker.occupation,
      )
        .filter((people) => people.canWork())
        .slice(0, maxWorkers);

      if (!availableWorkers.length) {
        continue;
      }

      for (const worker of availableWorkers) {
        worker.hasWork = true;
        for (const resource of resourcesProbabilities) {
          if (isWithinChance(resource.probability)) {
            const amount = Math.floor(getRandomInt(1, 100) * this.productionMultiplier);
            this.increaseResource(resource.resource, amount);

            if (building.capacity != null) {
              building.capacity -= amount;

              if (building.capacity <= 0) {
                this.removeBuilding(building);
                return;
              }
            }
          }
        }
      }
    }
  }

  private produceResources() {
    if (this.sawmill) {
      this.useProductionBuilding(this.sawmill);
    }

    if (this.kiln) {
      this.useProductionBuilding(this.kiln);
    }

    if (this.farm) {
      this.useProductionBuilding(this.farm);
    }

    if (this.campfire) {
      this.useProductionBuilding(this.campfire);
    }
  }

  private produceResearch(): void {
    const library = this.buildings.find(
      (building) => building.getType() === BuildingTypes.LIBRARY,
    ) as Library | undefined
    if (!library) {
      return
    }

    const requiredPerLibrary =
      library.workerTypeRequired.find(
        (worker) => worker.occupation === OccupationTypes.ERUDIT,
      )?.count ?? 0
    if (requiredPerLibrary === 0) {
      return
    }

    const totalCapacity = requiredPerLibrary * library.count
    const erudits = this.getPeopleWithOccupation(OccupationTypes.ERUDIT).filter(
      // A building erudit is busy on a construction site and does not research.
      (person) => person.work?.canWork(person.years) && !person.isBuilding,
    )
    const staffed = Math.min(erudits.length, totalCapacity)

    for (const erudit of erudits.slice(0, staffed)) {
      erudit.hasWork = true
    }

    this._researchPoints += Math.floor(
      Library.researchOutput * (staffed / requiredPerLibrary) * this.researchMultiplier,
    )
  }

  private buildChosenBuilding(): void {
    const chosen = this.config.NEXT_BUILDING_TO_BUILD;
    if (!chosen) {
      return;
    }

    // Defensive guard: an invalid stored building type (e.g. from a crafted
    // request) would otherwise crash the monthly tick on the constructor
    // lookup below. Drop the request instead.
    if (!(chosen in BUILDING_CONSTRUCTORS)) {
      this.config.NEXT_BUILDING_TO_BUILD = null;
      return;
    }

    // Buildings stack via their `count`, so an existing one of this type is NOT a
    // blocker for a player-chosen build. Only skip if a build of this type is
    // already under construction, to avoid double-queueing the same chantier.
    if (this.isBuildingPending(chosen)) {
      this.config.NEXT_BUILDING_TO_BUILD = null;
      return;
    }

    // Wall precondition: needs at least Wall.minBuilders able-bodied workers.
    if (chosen === BuildingTypes.WALL) {
      const builders = this.people.filter(
        (person) => person.canWork() && person.work?.occupationType !== OccupationTypes.SOLDIER,
      ).length;
      if (builders < Wall.minBuilders) {
        return; // keep the request; retry next month
      }
    }

    const constructor = BUILDING_CONSTRUCTORS[chosen] as {
      constructionCosts: ConstructionCost[];
      workerRequiredToBuild: WorkerRequiredToBuild[];
      timeToBuild: number;
    };
    this.buildNew(
      chosen,
      constructor.constructionCosts,
      constructor.workerRequiredToBuild,
      constructor.timeToBuild,
    );

    // Clear the request only if the chantier actually started.
    if (this.isBuildingPending(chosen)) {
      this.config.NEXT_BUILDING_TO_BUILD = null;
    }
  }

  private buildNewBuilding(_world?: World) {
    this.buildChosenBuilding();
    this.buildNewHouses();

    const candidates = this.autoBuildCandidates()
      .filter((candidate) => candidate.weight > 0)
      .sort((a, b) => b.weight - a.weight);

    for (const candidate of candidates) {
      if (isWithinChance(this.config.CHANCE_TO_BUILD_EVOLVED_BUILDING)) {
        this.buildNew(
          candidate.type,
          candidate.ctor.constructionCosts,
          candidate.ctor.workerRequiredToBuild,
          candidate.ctor.timeToBuild,
        );
      }
    }
  }

  /**
   * Candidates for auto-construction, weighted by civilization needs.
   * Weight 0 means no need (candidate is filtered out before the chance roll).
   * Candidates are sorted by descending weight so the highest-priority need
   * reserves builders and resources first. Final gating (tech unlock, resource
   * check, available workers) is applied inside buildNew().
   *
   * A new instance of a staffed building is only queued when:
   *   - none exists yet (bootstrap weight), OR
   *   - existing instances are full AND there is a surplus of workers of the
   *     required occupation beyond current capacity (expansion weight ∝ surplus).
   * This prevents building copies that would remain unstaffed.
   */
  private autoBuildCandidates(): {
    type: BuildingTypes;
    ctor: {
      constructionCosts: ConstructionCost[];
      workerRequiredToBuild: WorkerRequiredToBuild[];
      timeToBuild: number;
    };
    weight: number;
  }[] {
    const pendingCount = (type: BuildingTypes) =>
      this.pendingConstructions.filter((p) => p.buildingType === type).length;

    // Staffed building: build the first (bootstrap), or expand only when all
    // existing instances are full and there is a surplus of qualified workers.
    const expansionWeight = (
      builtCount: number,
      type: BuildingTypes,
      occupation: OccupationTypes,
      workersPerBuilding: number,
      bootstrap: number,
    ): number => {
      const totalCount = builtCount + pendingCount(type);
      if (totalCount === 0) {
        return bootstrap;
      }
      const workers = this.getPeopleWithOccupation(occupation).length;
      const surplus = workers - totalCount * workersPerBuilding;
      return surplus > 0 ? Math.min(10, surplus) : 0;
    };

    return [
      {
        type: BuildingTypes.CACHE,
        ctor: Cache,
        weight: !this.cache?.count && !this.isBuildingPending(BuildingTypes.CACHE) ? 8 : 0,
      },
      {
        type: BuildingTypes.FARM,
        ctor: Farm,
        weight: expansionWeight(this.farm?.count ?? 0, BuildingTypes.FARM, OccupationTypes.FARMER, 5, 6),
      },
      {
        type: BuildingTypes.CAMPFIRE,
        ctor: Campfire,
        weight: expansionWeight(this.campfire?.count ?? 0, BuildingTypes.CAMPFIRE, OccupationTypes.KITCHEN_ASSISTANT, 1, 4),
      },
      {
        type: BuildingTypes.SAWMILL,
        ctor: Sawmill,
        weight: expansionWeight(this.sawmill?.count ?? 0, BuildingTypes.SAWMILL, OccupationTypes.CARPENTER, 2, 4),
      },
      {
        type: BuildingTypes.KILN,
        ctor: Kiln,
        weight: expansionWeight(this.kiln?.count ?? 0, BuildingTypes.KILN, OccupationTypes.CHARCOAL_BURNER, 2, 4),
      },
      {
        type: BuildingTypes.MINE,
        ctor: Mine,
        weight: expansionWeight(this.mine?.count ?? 0, BuildingTypes.MINE, OccupationTypes.MINER, 10, 9),
      },
      {
        type: BuildingTypes.LIBRARY,
        ctor: Library,
        weight: expansionWeight(this.library?.count ?? 0, BuildingTypes.LIBRARY, OccupationTypes.ERUDIT, 2, 3),
      },
    ];
  }

  private buildNewHouses() {
    const canBuild = House.constructionCosts.every(
      (cost) => this.getResource(cost.resource).quantity >= cost.amount,
    );
    if (!canBuild) {
      return;
    }

    // Count pending houses toward effective capacity so in-flight construction
    // isn't re-queued every month until it completes.
    const pendingHouses = this.pendingConstructions.filter(
      (pending) => pending.buildingType === BuildingTypes.HOUSE,
    ).length;
    const housesTotalCapacity =
      House.capacity * ((this.houses?.count ?? 0) + pendingHouses);
    const workerNeeded = Math.ceil(
      (this._people.length - housesTotalCapacity) / House.capacity,
    );

    if (workerNeeded < 0) {
      return;
    }
    const filteredWorkers = this.people.filter(
      (citizen) => citizen.canWork() && citizen.work?.occupationType !== OccupationTypes.SOLDIER,
    );
    const workers = filteredWorkers.slice(
      0,
      Math.min(workerNeeded, filteredWorkers.length),
    );

    for (const worker of workers) {
      const canContinueBuilding = House.constructionCosts.every(
        (cost) => this.getResource(cost.resource).quantity >= cost.amount,
      );

      if (!canContinueBuilding) {
        return;
      }

      for (const cost of House.constructionCosts) {
        this.decreaseResource(cost.resource, cost.amount);
      }

      // One pending entry is pushed per available worker: parallel
      // construction sites are intended (one house per worker in flight).
      worker.startBuilding(House.timeToBuild, BuildingTypes.HOUSE);
      this.startConstruction(BuildingTypes.HOUSE, House.timeToBuild);
    }
  }

  private buildNew(
    buildingType: BuildingTypes,
    constructionCosts: ConstructionCost[],
    workerRequiredToBuild: WorkerRequiredToBuild[],
    timeToBuild: number,
  ) {
    if (!this.isBuildingUnlocked(buildingType)) {
      return;
    }

    const canBuild =
      constructionCosts.every(
        (cost) => this.getResource(cost.resource).quantity >= cost.amount,
      ) || !constructionCosts.length;
    if (!canBuild) {
      return;
    }

    const workers = workerRequiredToBuild.reduce<People[]>(
      (workers, workerRequired) => {
        const availableWorkers = this.getPeopleWithOccupation(
          workerRequired.occupation,
        );
        for (let i = 0; i < workerRequired.amount; i++) {
          const worker = availableWorkers.find(
            (citizen) =>
              citizen.canWork() && !workers.find(({ id }) => id === citizen.id),
          );
          if (worker) {
            workers.push(worker);
          }
        }
        return workers;
      },
      [],
    );

    if (
      workers.length <
      workerRequiredToBuild.reduce((sum, { amount }) => sum + amount, 0)
    ) {
      return;
    }
    for (const worker of workers) {
      worker.startBuilding(timeToBuild, buildingType);
    }

    for (const cost of constructionCosts) {
      this.decreaseResource(cost.resource, cost.amount);
    }

    this.startConstruction(buildingType, timeToBuild);
  }

  private checkHousing() {
    let lastCitizenWithoutHouseIndex = 0;
    if (this.houses) {
      lastCitizenWithoutHouseIndex = House.capacity * this.houses.count - 1;
    }
    const citizenWithoutHouse = this.people.slice(lastCitizenWithoutHouseIndex);

    // Being unsheltered is exposure to the elements, recorded under "cold".
    for (const citizen of citizenWithoutHouse) {
      citizen.decreaseLife(1, DeathCause.COLD);
    }
  }

  public adaptPeopleJob() {
    const workers = this.getWorkersWhoCanRetire();
    for (const citizen of workers) {
      citizen.setOccupation(OccupationTypes.RETIRED);
    }

    const peoplesWhoHasNotWork = this.getPeopleWithoutOccupation(
      OccupationTypes.CHILD,
    ).filter(
      ({ work, hasWork }) =>
        work?.occupationType !== OccupationTypes.RETIRED &&
        work &&
        ![OccupationTypes.GATHERER, OccupationTypes.WOODCUTTER].includes(
          work.occupationType,
        ) &&
        !hasWork,
    );
    for (const peopleWhoHasNotWork of peoplesWhoHasNotWork) {
      for (const [key, jobs] of Object.entries(OCCUPATION_TREE)) {
        if (key === OccupationTypes.CHILD) continue;
        if (
          peopleWhoHasNotWork.work &&
          jobs.includes(peopleWhoHasNotWork.work.occupationType)
        ) {
          peopleWhoHasNotWork.setOccupation(key as OccupationTypes);
        }
      }
    }

    const workersCanUpgrade = this.getWorkersWhoCanUpgrade();
    for (const worker of workersCanUpgrade) {
      const hasChanceToEvolve =
        worker.work?.occupationType === OccupationTypes.CHILD ||
        isWithinChance(this.config.CHANCE_TO_EVOLVE);
      if (hasChanceToEvolve && worker.work && worker.canUpgradeWork()) {
        // Only keep target trades the worker is actually old enough to take up.
        // This enforces each job's own entry age (e.g. miners at 25) instead of
        // relying solely on the source job's upgrade age.
        const newPossibleOccupations = (
          OCCUPATION_TREE[worker.work.occupationType] ?? []
        ).filter(
          (occupation) => worker.years >= MINIMAL_AGE_TO_BECOME[occupation],
        );

        if (!newPossibleOccupations.length) {
          continue;
        }

        const selectedNewOccupation = getRandomInt(
          0,
          newPossibleOccupations.length - 1,
        );
        const newOccupation = newPossibleOccupations[selectedNewOccupation];

        if (
          newOccupation &&
          (this.getWorkerSpaceLeft(newOccupation) > 0 ||
            [OccupationTypes.GATHERER, OccupationTypes.WOODCUTTER].includes(
              newOccupation,
            ))
        ) {
          worker.setOccupation(newOccupation);
        }
      }
    }

    this.recruitSoldiers();
  }

  private recruitSoldiers(): void {
    const ratio = this.config.MILITARY_RATIO ?? 0;
    const adults = this.getPeopleWithoutOccupation(OccupationTypes.CHILD).filter(
      (person) => person.work?.occupationType !== OccupationTypes.RETIRED,
    );
    const targetSoldiers = Math.floor((adults.length * ratio) / 100);
    const currentSoldiers = this.getPeopleWithOccupation(OccupationTypes.SOLDIER);

    if (currentSoldiers.length === targetSoldiers) {
      return;
    }

    if (currentSoldiers.length < targetSoldiers) {
      const recruitable = adults.filter(
        (person) =>
          person.work?.occupationType !== OccupationTypes.SOLDIER &&
          // Une femme enceinte ne peut pas devenir soldat.
          person.pregnancyMonthsLeft <= 0 &&
          // Un citoyen occupé à construire ne peut pas être enrôlé.
          !person.isBuilding,
      );
      const toRecruit = targetSoldiers - currentSoldiers.length;
      for (const person of recruitable.slice(0, toRecruit)) {
        person.setOccupation(OccupationTypes.SOLDIER);
      }
    } else {
      // Over target (ratio lowered): release the surplus back to gathering.
      const toRelease = currentSoldiers.length - targetSoldiers;
      for (const person of currentSoldiers.slice(0, toRelease)) {
        person.setOccupation(OccupationTypes.GATHERER);
      }
    }
  }

  private async createNewPeople() {
    // Handle pregnancy

    if (this.maxChildren <= this.childrenCount) {
      return;
    }

    let eligiblePeople: [People, People][] = [];
    const maxChildrenPerWoman = this.effectiveMaxChildrenPerWoman;
    const ableToConceivePeople = this._people.filter((person) =>
      person.canConceive(maxChildrenPerWoman),
    );

    const women = ableToConceivePeople.filter(
      ({ gender }) => gender === Gender.FEMALE,
    );
    const men = ableToConceivePeople
      .filter(({ gender }) => gender === Gender.MALE)
      .toSorted(() => Math.random() - 0.5);

    if (!women.length) {
      return;
    }

    // Direct lineage is recomputed for every (woman, man) comparison below,
    // which is quadratic in the fertile population. Memoize it per person so
    // each lineage is only built once per month.
    const lineageCache = new Map<People, string[]>();
    const lineageOf = (person: People): string[] => {
      let lineage = lineageCache.get(person);
      if (!lineage) {
        lineage = person.getDirectLineage();
        lineageCache.set(person, lineage);
      }
      return lineage;
    };

    for (const woman of women) {
      const womanLineage = lineageOf(woman);
      const eligibleManIndex = men.findIndex(
        (man) => !hasElementInCommon(womanLineage, lineageOf(man)),
      );

      if (eligibleManIndex === -1) {
        continue;
      }
      const [eligibleMan] = men.splice(eligibleManIndex, 1);

      if (eligibleMan) {
        eligiblePeople.push([woman, eligibleMan]);
      }
    }

    if (!eligiblePeople.length) {
      return;
    }

    await Promise.all(
      eligiblePeople.map(
        ([mother, father]) =>
          new Promise((resolve) => {
            if (!isWithinChance(this.effectivePregnancyProbability) || !mother) {
              return resolve(null);
            }

            const genders = [Gender.FEMALE, Gender.MALE];
            const newPerson = new People({
              month: 0,
              gender:
                genders[
                Math.min(
                  Math.floor(Math.random() * genders.length),
                  genders.length - 1,
                )
                ],
              lifeCounter: 2,
              originCivilizationId: this.id,
              lineage: {
                mother: {
                  id: mother.id,
                  ...(mother.lineage && {
                    lineage: {
                      mother: { id: mother.lineage.mother?.id },
                      father: { id: mother.lineage.father?.id },
                    },
                  }),
                },
                father: {
                  id: father.id,
                  ...(father.lineage && {
                    lineage: {
                      mother: { id: father.lineage.mother?.id },
                      father: { id: father.lineage.father?.id },
                    },
                  }),
                },
              },
            });
            newPerson.setOccupation(OccupationTypes.CHILD);

            mother.addChildToBirth(newPerson);

            mother.lifeCounter = Math.floor(mother.lifeCounter / 2);
            father.lifeCounter = Math.floor(father.lifeCounter / 2);
            resolve(null);
          }),
      ),
    );
  }

  private async birthAwaitingBabies() {
    const awaitingMothers = this._people.filter<People & { child: People; }>(
      (person): person is People & { child: People; } =>
        !!(person.pregnancyMonthsLeft === 0 && person.child),
    );

    await Promise.all(
      awaitingMothers.map(
        (mother) =>
          new Promise((resolve) => {
            this.addPeople(mother.child);
            mother.giveBirth();
            resolve(null);
          }),
      ),
    );
  }

  private removeDeadPeople() {
    const survivors: People[] = [];
    for (const person of this._people) {
      // isAlive() rolls for old-age death, so call it exactly once per person.
      if (person.isAlive()) {
        survivors.push(person);
        continue;
      }
      // lifeCounter <= 0 means a damage cause killed them (tagged on the killing
      // blow); a still-positive life means they died of old age.
      const cause =
        person.lifeCounter <= 0
          ? (person.deathCause ?? DeathCause.STARVATION)
          : DeathCause.OLD_AGE;
      this._deaths.push({ name: person.name, cause });
    }
    this._people = survivors;
  }
}
