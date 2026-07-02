import { countries, uniqueNamesGenerator } from "unique-names-generator";
import { v4 } from "uuid";

import { isExtractionOrProductionBuilding } from "./buildings";
import { Cache } from "./buildings/cache";
import { Warehouse } from "./buildings/warehouse";
import { Campfire } from "./buildings/campfire";
import { BuildingTypes } from "./buildings/enum";
import { Farm } from "./buildings/farm";
import { House } from "./buildings/house";
import { Kiln } from "./buildings/kiln";
import { Library } from "./buildings/library";
import { Mine } from "./buildings/mine";
import { Sawmill } from "./buildings/sawmill";
import { Tent } from "./buildings/tent";
import { getUpgradeRequirement } from "./buildings/upgrades";
import { Wall } from "./buildings/wall";
import { Gender } from "./people/enum";
import { People, MAX_NUMBER_OF_CHILD } from "./people/people";
import { DeathCause, type DeathRecord } from "./people/death";
import { OccupationTypes } from "./people/work/enum";
import { MINIMAL_AGE_TO_BECOME } from "./people/work/ages";
import {
  BUILDING_REQUIRED_OCCUPATIONS,
  DEFAULT_OCCUPATION_DISTRIBUTION,
  DISTRIBUTABLE_OCCUPATIONS,
  OCCUPATION_BUILDING,
  OCCUPATION_BUILDING_SLOTS,
  resolveTargetHeadcounts,
} from "./people/work/distribution";
import {
  ERUDIT_BASE_RESEARCH,
  ERUDIT_BOOSTED_RESEARCH,
  OCCUPATION_PRODUCTION,
  type WorkerConversion,
} from "./people/work/production";
import { Resource, ResourceTypes } from "./resource";
import { OCCUPATION_TREE } from "./technology/occupationTree";
import { TechId, getTechNode, getBuildingGate } from "./technology/techTree";
import { Events } from "./events/enum";
import {
  AbstractExtractionBuilding, AbstractStorageBuilding, type Building, type ConstructionCost,
  type ExtractionBuilding, type WorkerRequiredToBuild
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
  SPEED_MODE: true,
  OCCUPATION_DISTRIBUTION: { ...DEFAULT_OCCUPATION_DISTRIBUTION },
};

const BUILDING_CONSTRUCTORS = {
  [BuildingTypes.FARM]: Farm,
  [BuildingTypes.KILN]: Kiln,
  [BuildingTypes.TENT]: Tent,
  [BuildingTypes.HOUSE]: House,
  [BuildingTypes.SAWMILL]: Sawmill,
  [BuildingTypes.CAMPFIRE]: Campfire,
  [BuildingTypes.MINE]: Mine,
  [BuildingTypes.CACHE]: Cache,
  [BuildingTypes.WAREHOUSE]: Warehouse,
  [BuildingTypes.WALL]: Wall,
  [BuildingTypes.LIBRARY]: Library,
};

const UNDESTRUCTIBLE_BUILDINGS = [BuildingTypes.CACHE, BuildingTypes.WAREHOUSE];

const EXTRACTIONS_RESOURCES: { [key in BuildingTypes]?: ResourceTypes[] } = {
  [BuildingTypes.MINE]: [ResourceTypes.STONE],
};

const STORAGE_BUILDINGS = [BuildingTypes.CACHE, BuildingTypes.WAREHOUSE];
const EXTRACTIONS_BUILDINGS = [BuildingTypes.MINE];

// Bâtiments qui logent des citoyens, du meilleur au plus rudimentaire. La
// construction automatique vise toujours le premier type débloqué dont le
// prérequis d'évolution (BUILDING_UPGRADES) est satisfaisable.
const HOUSING_BUILDINGS = [BuildingTypes.HOUSE, BuildingTypes.TENT];

const HOUSING_CAPACITY: { [key in BuildingTypes]?: number } = {
  [BuildingTypes.HOUSE]: House.capacity,
  [BuildingTypes.TENT]: Tent.capacity,
};

// Bâtiments limités à UN seul exemplaire par civilisation : ils ne s'empilent
// pas via `count`. Une mine partage une unique `capacity` tirée au hasard, donc
// l'empiler corromprait son gisement ; il faut qu'elle s'épuise (et soit
// détruite) pour pouvoir en creuser une nouvelle.
const UNIQUE_BUILDINGS = [BuildingTypes.MINE];

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
  // Passé à true pendant la consommation du mois si au moins un citoyen n'a pas
  // pu être nourri. Utilisé pour ne lancer aucun nouveau chantier tant que la
  // survie n'est pas assurée (la main-d'œuvre reste alors dédiée à la récolte).
  private _starvedThisMonth = false;
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
      OCCUPATION_DISTRIBUTION: { ...defaultCivilizationConfig.OCCUPATION_DISTRIBUTION },
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

  get tents(): Tent | undefined {
    return this.buildings.find<Tent>(
      (building): building is Tent =>
        building.getType() === BuildingTypes.TENT,
    );
  }

  // Capacité totale de logement, tous types confondus (tentes + maisons).
  get housingCapacity(): number {
    return this.buildings.reduce(
      (total, building) =>
        total + (HOUSING_CAPACITY[building.getType()] ?? 0) * building.count,
      0,
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

  // Total staffing slots for an occupation across all built extraction/production
  // buildings (Σ workerTypeRequired.count × building.count).
  private occupationCapacity(workerType: OccupationTypes): number {
    return this.buildings.reduce((space, building) => {
      if (isExtractionOrProductionBuilding(building)) {
        space +=
          building.workerTypeRequired
            .filter((worker) => worker.occupation === workerType)
            .reduce((sum, { count }) => sum + count, 0) * building.count;
      }
      return space;
    }, 0);
  }

  // Occupations the distribution can currently steer toward. Depuis la refonte
  // « le métier produit, le bâtiment booste », presque tous les métiers
  // s'exercent sans bâtiment : seuls ceux de BUILDING_REQUIRED_OCCUPATIONS
  // (mineur) restent gardés par le déblocage de leur bâtiment. Les métiers
  // exclus voient leur part renormalisée sur les autres (resolveTargetHeadcounts).
  private activeDistributableOccupations(): OccupationTypes[] {
    return DISTRIBUTABLE_OCCUPATIONS.filter((occupation) => {
      if (!BUILDING_REQUIRED_OCCUPATIONS.includes(occupation)) {
        return true;
      }
      const building = OCCUPATION_BUILDING[occupation];
      return !building || this.isBuildingUnlocked(building);
    });
  }

  // Size of the civilian working pool the gauges distribute (soldiers, children
  // and the retired are excluded — soldiers are governed by MILITARY_RATIO).
  private civilianWorkforce(): number {
    return this._people.filter(
      (person) =>
        person.work &&
        DISTRIBUTABLE_OCCUPATIONS.includes(person.work.occupationType),
    ).length;
  }

  // Target headcount per occupation from the configured percentage split.
  private occupationTargets(): Map<OccupationTypes, number> {
    return resolveTargetHeadcounts({
      distribution:
        this.config.OCCUPATION_DISTRIBUTION ?? DEFAULT_OCCUPATION_DISTRIBUTION,
      workforce: this.civilianWorkforce(),
      activeOccupations: this.activeDistributableOccupations(),
    });
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
      this._deaths.push({ name: soldier.name, cause: DeathCause.WAR, ageAtDeath: soldier.month });
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

    // Un bâtiment unique ne s'empile jamais : un chantier excédentaire (p. ex.
    // mis en file avant la règle d'unicité) se termine sans effet plutôt que
    // d'incrémenter le count et de re-tirer des outputs sur la capacité partagée.
    if (UNIQUE_BUILDINGS.includes(type)) {
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

  // Un bâtiment évolué (BUILDING_UPGRADES) ne peut être lancé que si assez
  // d'exemplaires de son bâtiment de base sont debout.
  private hasUpgradeBase(buildingType: BuildingTypes): boolean {
    const requirement = getUpgradeRequirement(buildingType);
    if (!requirement) {
      return true;
    }
    const base = this.buildings.find(
      (building) => building.getType() === requirement.from,
    );
    return (base?.count ?? 0) >= requirement.amount;
  }

  // Consomme le(s) bâtiment(s) de base au lancement du chantier (comme les
  // ressources). Retourne la capacité de logement perdue par cette consommation
  // pour que l'appelant puisse raisonner en capacité nette.
  private consumeUpgradeBase(buildingType: BuildingTypes): number {
    const requirement = getUpgradeRequirement(buildingType);
    if (!requirement) {
      return 0;
    }
    const base = this.buildings.find(
      (building) => building.getType() === requirement.from,
    );
    if (!base) {
      return 0;
    }
    base.count -= requirement.amount;
    if (base.count <= 0) {
      this.removeBuilding(base);
    }
    return (HOUSING_CAPACITY[requirement.from] ?? 0) * requirement.amount;
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

  // Un bâtiment unique est bloqué tant qu'un exemplaire est debout OU en chantier.
  private isUniqueBuildingBlocked(buildingType: BuildingTypes): boolean {
    return (
      UNIQUE_BUILDINGS.includes(buildingType) &&
      (this.buildings.some((building) => building.getType() === buildingType) ||
        this.isBuildingPending(buildingType))
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

        this._starvedThisMonth = true;
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
    // Nouveau mois : on repart d'un état alimentaire sain, réévalué par la
    // consommation plus bas.
    this._starvedThisMonth = false;

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

  /**
   * Production par citoyen : chaque travailleur du métier produit, avec ou sans
   * bâtiment. Les places offertes par les bâtiments debout (workerTypeRequired ×
   * count) sont attribuées aux premiers travailleurs — production « boostée » ;
   * les autres produisent la version « base » au rendement dégradé
   * (OCCUPATION_PRODUCTION). Les intrants disponibles plafonnent le nombre de
   * travailleurs réellement servis, boostés d'abord.
   */
  private produceForOccupation(occupation: OccupationTypes): void {
    const production = OCCUPATION_PRODUCTION[occupation];
    if (!production) {
      return;
    }

    const workers = this.getPeopleWithOccupation(occupation).filter((person) =>
      person.canWork(),
    );
    if (!workers.length) {
      return;
    }

    const boostedCount = Math.min(
      workers.length,
      this.occupationCapacity(occupation),
    );
    const baseCount = workers.length - boostedCount;

    for (const worker of workers) {
      worker.hasWork = true;
    }

    const conversions: [WorkerConversion, number][] = [
      [production.boosted, boostedCount],
      [production.base, baseCount],
    ];

    for (const [conversion, count] of conversions) {
      if (count <= 0) {
        continue;
      }

      // Les intrants disponibles limitent le nombre de travailleurs servis.
      let effectiveWorkers = count;
      for (const input of conversion.inputs) {
        effectiveWorkers = Math.min(
          effectiveWorkers,
          Math.floor(this.getResource(input.resource).quantity / input.amount),
        );
      }
      if (effectiveWorkers <= 0) {
        continue;
      }

      for (const input of conversion.inputs) {
        this.decreaseResource(
          input.resource,
          Math.ceil(input.amount * effectiveWorkers),
        );
      }
      for (const output of conversion.outputs) {
        this.increaseResource(
          output.resource,
          Math.ceil(
            output.amount * effectiveWorkers * this.productionMultiplier,
          ),
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

  // La nourriture d'abord (fermiers puis cuisine), puis la chaîne du bois :
  // les planches du charpentier consomment le bois avant le charbonnier.
  private produceResources() {
    this.produceForOccupation(OccupationTypes.FARMER);
    this.produceForOccupation(OccupationTypes.KITCHEN_ASSISTANT);
    this.produceForOccupation(OccupationTypes.CARPENTER);
    this.produceForOccupation(OccupationTypes.CHARCOAL_BURNER);
  }

  // Les érudits produisent même sans bibliothèque, mais à un rythme
  // drastiquement réduit (0,2 pt/mois contre 1 pt avec une place).
  private produceResearch(): void {
    const erudits = this.getPeopleWithOccupation(OccupationTypes.ERUDIT).filter(
      (person) => person.work?.canWork(person.years) && !person.isBuilding,
    )
    if (!erudits.length) {
      return
    }

    const boosted = Math.min(
      erudits.length,
      this.occupationCapacity(OccupationTypes.ERUDIT),
    )
    const base = erudits.length - boosted

    for (const erudit of erudits) {
      erudit.hasWork = true
    }

    this._researchPoints += Math.floor(
      (boosted * ERUDIT_BOOSTED_RESEARCH + base * ERUDIT_BASE_RESEARCH) *
      this.researchMultiplier,
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

    // Exception : les bâtiments uniques (mine) ne s'empilent pas. La demande est
    // abandonnée plutôt que réessayée indéfiniment chaque mois.
    if (this.isUniqueBuildingBlocked(chosen)) {
      this.config.NEXT_BUILDING_TO_BUILD = null;
      return;
    }

    // Wall precondition: needs at least Wall.minBuilders able-bodied citizens
    // (the whole city pitches in), even though the chantier itself is run by
    // the declared constructeurs.
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

  private isSurvivalAtRisk(): boolean {
    return this._starvedThisMonth;
  }

  private buildNewBuilding(_world?: World) {
    // Extraction/production/recherche ont déjà marqué leurs ouvriers
    // `hasWork=true` plus tôt dans le mois. La construction est une phase
    // d'affectation distincte : on repart d'une ardoise propre pour qu'elle
    // puisse mobiliser des ouvriers (la double-affectation est empêchée par
    // `isBuilding`). Sans ce reset, aucun ouvrier n'est disponible après les
    // phases de travail → plus rien ne se construit. Ce reset laisse aussi
    // `hasWork` à false pour l'extraction du mois suivant (crucial en mode
    // rapide, où plusieurs mois s'enchaînent sans recharger l'état depuis la DB).
    for (const person of this._people) {
      person.hasWork = false;
    }

    // Priorité à la survie : si la civilisation n'a pas pu nourrir tout le monde
    // ce mois-ci, on ne lance AUCUN nouveau chantier — la main-d'œuvre reste
    // dédiée à la récolte. Les chantiers déjà en cours continuent
    // (progressConstructions, appelé avant). L'extraction n'est donc prioritaire
    // sur la construction QUE lorsque la survie est menacée.
    if (this.isSurvivalAtRisk()) {
      return;
    }

    this.buildChosenBuilding();
    this.buildNewHousing();

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
   * Candidates for auto-construction. Weight 0 means no need (candidate is
   * filtered out before the chance roll). Candidates are sorted by descending
   * weight so the highest-priority need reserves builders and resources first.
   * Final gating (tech unlock, resource check, available builders) is applied
   * inside buildNew().
   *
   * Deux régimes de poids :
   *  - Ferme et Bibliothèque ne sont que des boosts : leur poids est le nombre
   *    de travailleurs du métier NON boostés (effectif − places bâties − places
   *    en chantier) — le bâtiment suit les travailleurs pour les accélérer.
   *  - Les bâtiments dont le métier est exigé (mine, feu de camp, scierie,
   *    four à chaux) gardent un poids piloté par la cible de la jauge
   *    (cible − places bâties/en chantier), car sans bâtiment ces travailleurs
   *    ne peuvent pas exister.
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
    const targets = this.occupationTargets();

    // Missing staffing slots for a building-required occupation (mine):
    // target − (built + pending) capacity. Tech-locked buildings never get weight.
    const capacityGap = (
      type: BuildingTypes,
      occupation: OccupationTypes,
    ): number => {
      if (!this.isBuildingUnlocked(type)) {
        return 0;
      }
      const slotsPerBuilding = OCCUPATION_BUILDING_SLOTS[occupation] ?? 0;
      const pendingCapacity = pendingCount(type) * slotsPerBuilding;
      const effectiveCapacity = this.occupationCapacity(occupation) + pendingCapacity;
      return Math.max(0, (targets.get(occupation) ?? 0) - effectiveCapacity);
    };

    // Travailleurs du métier sans place boostée : effectif actuel − places
    // bâties − places en chantier. C'est le besoin réel de boost.
    const boostGap = (
      type: BuildingTypes,
      occupation: OccupationTypes,
    ): number => {
      if (!this.isBuildingUnlocked(type)) {
        return 0;
      }
      const slotsPerBuilding = OCCUPATION_BUILDING_SLOTS[occupation] ?? 0;
      const pendingCapacity = pendingCount(type) * slotsPerBuilding;
      const unboosted =
        this.getPeopleWithOccupation(occupation).length -
        (this.occupationCapacity(occupation) + pendingCapacity);
      return Math.max(0, unboosted);
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
        weight: boostGap(BuildingTypes.FARM, OccupationTypes.FARMER),
      },
      {
        type: BuildingTypes.CAMPFIRE,
        ctor: Campfire,
        weight: capacityGap(BuildingTypes.CAMPFIRE, OccupationTypes.KITCHEN_ASSISTANT),
      },
      {
        type: BuildingTypes.SAWMILL,
        ctor: Sawmill,
        weight: capacityGap(BuildingTypes.SAWMILL, OccupationTypes.CARPENTER),
      },
      {
        type: BuildingTypes.KILN,
        ctor: Kiln,
        weight: capacityGap(BuildingTypes.KILN, OccupationTypes.CHARCOAL_BURNER),
      },
      {
        type: BuildingTypes.MINE,
        ctor: Mine,
        // Unique : le déficit de mineurs ne pèse rien tant qu'une mine est
        // debout ou en chantier — capacityGap seul re-queuerait indéfiniment.
        weight: this.isUniqueBuildingBlocked(BuildingTypes.MINE)
          ? 0
          : capacityGap(BuildingTypes.MINE, OccupationTypes.MINER),
      },
      {
        type: BuildingTypes.LIBRARY,
        ctor: Library,
        weight: boostGap(BuildingTypes.LIBRARY, OccupationTypes.ERUDIT),
      },
    ];
  }

  // Le meilleur logement constructible aujourd'hui : premier type débloqué de
  // HOUSING_BUILDINGS dont le prérequis d'évolution est satisfaisable. Tant que
  // la Maison n'est pas recherchée (ou qu'aucune tente n'est disponible), la
  // civilisation monte des tentes.
  private pickHousingToBuild(): BuildingTypes | undefined {
    return HOUSING_BUILDINGS.find(
      (type) => this.isBuildingUnlocked(type) && this.hasUpgradeBase(type),
    );
  }

  private buildNewHousing() {
    // Count pending housing toward effective capacity so in-flight construction
    // isn't re-queued every month until it completes.
    const pendingHousingCapacity = this.pendingConstructions.reduce(
      (total, pending) =>
        total + (HOUSING_CAPACITY[pending.buildingType] ?? 0),
      0,
    );
    // Capacité nette manquante. Consommer une tente pour lancer une maison
    // retire immédiatement sa capacité : chaque chantier décrémente ce déficit
    // de son apport NET (maison 4 − tente 2 = 2).
    let missingCapacity =
      this._people.length - (this.housingCapacity + pendingHousingCapacity);

    if (missingCapacity <= 0) {
      return;
    }

    // Seuls les constructeurs bâtissent : le nombre de chantiers parallèles est
    // naturellement plafonné par l'effectif du métier (jauge de répartition).
    const availableWorkers = this.getPeopleWithOccupation(
      OccupationTypes.BUILDER,
    ).filter((citizen) => citizen.canWork());

    // One pending entry is pushed per available builder: parallel construction
    // sites are intended (one housing unit per builder in flight).
    for (const worker of availableWorkers) {
      if (missingCapacity <= 0) {
        return;
      }

      const housingType = this.pickHousingToBuild();
      if (!housingType) {
        return;
      }

      const constructor = BUILDING_CONSTRUCTORS[housingType] as {
        constructionCosts: ConstructionCost[];
        timeToBuild: number;
      };
      const canBuild = constructor.constructionCosts.every(
        (cost) => this.getResource(cost.resource).quantity >= cost.amount,
      );
      if (!canBuild) {
        return;
      }

      for (const cost of constructor.constructionCosts) {
        this.decreaseResource(cost.resource, cost.amount);
      }

      const lostCapacity = this.consumeUpgradeBase(housingType);
      worker.startBuilding(constructor.timeToBuild, housingType);
      this.startConstruction(housingType, constructor.timeToBuild);
      missingCapacity -=
        (HOUSING_CAPACITY[housingType] ?? 0) - lostCapacity;
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

    if (this.isUniqueBuildingBlocked(buildingType)) {
      return;
    }

    // Bâtiment évolué : le bâtiment de base requis doit exister (il sera
    // consommé au lancement du chantier, plus bas).
    if (!this.hasUpgradeBase(buildingType)) {
      return;
    }

    const canBuild =
      constructionCosts.every(
        (cost) => this.getResource(cost.resource).quantity >= cost.amount,
      ) || !constructionCosts.length;
    if (!canBuild) {
      return;
    }

    // Aucun chantier ne se construit tout seul : un bâtiment qui ne déclare
    // pas d'ouvriers requis mobilise au moins un constructeur — seul métier
    // habilité à bâtir.
    const requiredWorkers: WorkerRequiredToBuild[] = workerRequiredToBuild.length
      ? workerRequiredToBuild
      : [{ occupation: OccupationTypes.BUILDER, amount: 1 }];

    const workers = requiredWorkers.reduce<People[]>(
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
      requiredWorkers.reduce((sum, { amount }) => sum + amount, 0)
    ) {
      return;
    }
    for (const worker of workers) {
      worker.startBuilding(timeToBuild, buildingType);
    }

    for (const cost of constructionCosts) {
      this.decreaseResource(cost.resource, cost.amount);
    }

    this.consumeUpgradeBase(buildingType);
    this.startConstruction(buildingType, timeToBuild);
  }

  private checkHousing() {
    const housingCapacity = this.housingCapacity;
    const lastCitizenWithoutHouseIndex =
      housingCapacity > 0 ? housingCapacity - 1 : 0;
    const citizenWithoutHouse = this.people.slice(lastCitizenWithoutHouseIndex);

    // Being unsheltered is exposure to the elements, recorded under "cold".
    for (const citizen of citizenWithoutHouse) {
      citizen.decreaseLife(1, DeathCause.COLD);
    }
  }

  public adaptPeopleJob() {
    // 1. Retire those who have reached their occupation's retirement age.
    for (const citizen of this.getWorkersWhoCanRetire()) {
      citizen.setOccupation(OccupationTypes.RETIRED);
    }

    // 2. Steer the civilian workforce toward the configured distribution.
    this.steerOccupationDistribution();

    // 3. Military recruitment (governed by MILITARY_RATIO, orthogonal to the gauges).
    this.recruitSoldiers();
  }

  /**
   * Move citizens toward the configured occupation distribution:
   *  - maturing children join the base pool (gatherer/woodcutter) that most needs them,
   *  - surplus base workers are promoted into specialised jobs that have a gauge-wanted
   *    free slot (`current < min(target, capacity)`) and whose prerequisites they meet —
   *    deterministically, filling the largest deficit first,
   *  - specialists left over-capacity by a destroyed/shrunken building are released
   *    back to their base pool so they do useful work again.
   *
   * No probability gate and no random target: whenever a reachable, gauge-wanted,
   * unlocked slot is open and a qualified citizen exists, the promotion happens. The
   * gauge caps specialists at `min(target, capacity)`, so the total of specialists can
   * never exceed the sum of specialist targets and the base pool stays protected without
   * an explicit guard.
   */
  private steerOccupationDistribution(): void {
    const targets = this.occupationTargets();
    const active = new Set(this.activeDistributableOccupations());
    const current = new Map<OccupationTypes, number>();
    for (const occupation of DISTRIBUTABLE_OCCUPATIONS) {
      current.set(occupation, this.getPeopleWithOccupation(occupation).length);
    }

    const target = (occupation: OccupationTypes) => targets.get(occupation) ?? 0;
    const count = (occupation: OccupationTypes) => current.get(occupation) ?? 0;
    const adjust = (occupation: OccupationTypes, delta: number) =>
      current.set(occupation, count(occupation) + delta);

    // A gauge-wanted free slot: below target. Seuls les métiers qui exigent
    // physiquement leur bâtiment (mineur) restent plafonnés par la capacité
    // bâtie — les autres produisent sans bâtiment (rendement réduit), la jauge
    // seule décide de leur effectif.
    const roomCeiling = (occupation: OccupationTypes) =>
      BUILDING_REQUIRED_OCCUPATIONS.includes(occupation)
        ? Math.min(target(occupation), this.occupationCapacity(occupation))
        : target(occupation);
    const deficit = (occupation: OccupationTypes) =>
      roomCeiling(occupation) - count(occupation);
    const hasRoom = (occupation: OccupationTypes) =>
      active.has(occupation) && deficit(occupation) > 0;

    const BASE_JOBS = [OccupationTypes.GATHERER, OccupationTypes.WOODCUTTER];

    // Snapshot the movers up front so a child promoted to a base job this tick is not
    // re-promoted to a specialised job in the same tick.
    const maturingChildren = this._people.filter(
      (person) =>
        person.work?.occupationType === OccupationTypes.CHILD &&
        person.canUpgradeWork(),
    );
    const baseUpgraders = this._people.filter(
      (person) =>
        person.work &&
        BASE_JOBS.includes(person.work.occupationType) &&
        person.canUpgradeWork(),
    );

    // 2a. Children old enough to work join the more-deficient base pool.
    for (const child of maturingChildren) {
      const destination = BASE_JOBS.filter(
        (job) => child.years >= MINIMAL_AGE_TO_BECOME[job],
      ).sort((a, b) => target(b) - count(b) - (target(a) - count(a)))[0];
      if (!destination) continue;
      child.setOccupation(destination);
      adjust(destination, 1);
    }

    // 2b. Promote base workers into gauge-wanted, reachable, unlocked slots.
    for (const worker of baseUpgraders) {
      const source = worker.work!.occupationType;
      const destination = (OCCUPATION_TREE[source] ?? [])
        .filter(
          (occupation) =>
            worker.years >= MINIMAL_AGE_TO_BECOME[occupation] &&
            hasRoom(occupation),
        )
        .sort((a, b) => {
          const byDeficit = deficit(b) - deficit(a);
          if (byDeficit !== 0) return byDeficit;
          // Tie-break: fill the job with the most physical head-room first.
          return (
            this.occupationCapacity(b) -
            count(b) -
            (this.occupationCapacity(a) - count(a))
          );
        })[0];
      if (!destination) continue;
      worker.setOccupation(destination);
      adjust(source, -1);
      adjust(destination, 1);
    }

    // 2c. Release specialists a shrunken/destroyed building can no longer staff.
    // Ne concerne que les métiers qui exigent leur bâtiment (mineur) : les
    // autres continuent à produire sans bâtiment, simplement sans boost.
    for (const [parent, children] of Object.entries(OCCUPATION_TREE)) {
      if (parent === OccupationTypes.CHILD) continue;
      for (const occupation of children) {
        if (!BUILDING_REQUIRED_OCCUPATIONS.includes(occupation)) continue;
        if (!OCCUPATION_BUILDING[occupation]) continue;
        const excess = count(occupation) - this.occupationCapacity(occupation);
        if (excess <= 0) continue;
        const overstaffed = this._people.filter(
          (person) => person.work?.occupationType === occupation,
        );
        for (const person of overstaffed.slice(0, excess)) {
          person.setOccupation(parent as OccupationTypes);
          adjust(occupation, -1);
          adjust(parent as OccupationTypes, 1);
        }
      }
    }
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
      this._deaths.push({ name: person.name, cause, ageAtDeath: person.month });
    }
    this._people = survivors;
  }
}
