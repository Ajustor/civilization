# Uniform Construction Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every building non-instant: all construction goes through a uniform `pendingConstructions` pipeline with a per-building `timeToBuild`, and a building only becomes active when its countdown reaches zero.

**Architecture:** A civilization holds a list of in-progress constructions `{ buildingType, monthsRemaining }`. Initiating a build pays its resource cost, occupies workers, and pushes a pending entry instead of adding the building immediately. Each simulated month decrements every pending entry; entries reaching zero are activated via the existing `constructBuilding` (which creates a fresh building instance — e.g. a mine with a freshly-rolled capacity). State is persisted on the civilization document.

**Tech Stack:** TypeScript, Bun, Jest (ts-jest), Mongoose (Elysia backend).

This is plan 1 of 4 for the diplomacy/objectives spec (`docs/superpowers/specs/2026-06-25-diplomacy-objectives-design.md`). It is the foundation the wall/war plan depends on.

> **Test note:** Tests that exercise `Civilization` go in a NEW `construction.spec.ts`, run through `World`/`Civilization` like `world.spec.ts` (which runs cleanly). Do NOT add them to `civilization.spec.ts`, which currently fails to load on a pre-existing `source-map-support` tooling crash. Run the simulation suite from `packages/simulation` with `bunx jest`.

---

### Task 1: Pending construction type + House build time

**Files:**
- Modify: `packages/simulation/src/types/civilization.ts`
- Modify: `packages/simulation/src/buildings/house.ts`

- [ ] **Step 1: Add the `PendingConstruction` type and field**

In `packages/simulation/src/types/civilization.ts`, add the import and type, and add the field to `CivilizationType`:

```typescript
import { BuildingTypes } from '../buildings/enum'

export type PendingConstruction = {
  buildingType: BuildingTypes
  monthsRemaining: number
}
```

Add to the `CivilizationType` object type (alongside `config`):

```typescript
  config: CivilizationConfig
  pendingConstructions: PendingConstruction[]
```

- [ ] **Step 2: Give `House` a build time**

In `packages/simulation/src/buildings/house.ts`, add a static `timeToBuild` (matches the pattern on other buildings):

```typescript
export class House implements Building {
  static capacity = 4
  public static timeToBuild: number = 2
```

- [ ] **Step 3: Typecheck**

Run: `cd packages/simulation && bunx tsc --noEmit -p tsconfig.json` (run via repo-root `bunx tsc --noEmit -p packages/simulation/tsconfig.json` on Windows)
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add packages/simulation/src/types/civilization.ts packages/simulation/src/buildings/house.ts
git commit -m "feat(simulation): add PendingConstruction type and House.timeToBuild"
```

---

### Task 2: Civilization pending-construction state & pipeline

**Files:**
- Modify: `packages/simulation/src/civilization.ts`
- Test: `packages/simulation/src/construction.spec.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `packages/simulation/src/construction.spec.ts`. Houses are built deterministically (no `isWithinChance`), so we drive the pipeline through housing demand.

```typescript
import { Civilization } from './civilization'
import { People } from './people/people'
import { Resource, ResourceTypes } from './resource'
import { House } from './buildings/house'
import { BuildingTypes } from './buildings/enum'
import { Gender } from './people/enum'
import { OccupationTypes } from './people/work/enum'
import { World } from './world'

const healthyWorld = () => {
  const world = new World('W', 0, {
    BASE_FOOD_GENERATION: 0,
    BASE_WOOD_GENERATION: 0,
    EVENT_CHANCE: 0,
  })
  return world
}

const buildCivilizationNeedingHouses = () => {
  const civ = new Civilization('Builders')
  // plenty of resources so survival never interferes
  civ.addResource(
    new Resource(ResourceTypes.RAW_FOOD, 1_000_000),
    new Resource(ResourceTypes.COOKED_FOOD, 1_000_000),
    new Resource(ResourceTypes.WOOD, 1_000_000),
  )
  // working-age, healthy adults with no housing -> triggers house building
  for (let i = 0; i < 10; i++) {
    const person = new People({
      month: 12 * 25,
      gender: i % 2 === 0 ? Gender.FEMALE : Gender.MALE,
      lifeCounter: 50,
    })
    person.setOccupation(OccupationTypes.GATHERER)
    civ.addPeople(person)
  }
  return civ
}

describe('uniform construction pipeline', () => {
  it('queues a house as pending instead of building it instantly', async () => {
    const world = healthyWorld()
    const civ = buildCivilizationNeedingHouses()
    world.addCivilization(civ)

    expect(civ.buildings.filter((b) => b.getType() === BuildingTypes.HOUSE)).toHaveLength(0)

    await world.passAMonth()

    // No house yet: it is pending, not active
    expect(civ.pendingConstructions.some((c) => c.buildingType === BuildingTypes.HOUSE)).toBe(true)
    const houses = civ.buildings.find((b) => b.getType() === BuildingTypes.HOUSE)
    expect(houses?.count ?? 0).toBe(0)
  })

  it('activates the building once its countdown reaches zero', async () => {
    const world = healthyWorld()
    const civ = buildCivilizationNeedingHouses()
    world.addCivilization(civ)

    for (let month = 0; month < House.timeToBuild + 1; month++) {
      await world.passAMonth()
    }

    const houses = civ.buildings.find((b) => b.getType() === BuildingTypes.HOUSE)
    expect(houses?.count ?? 0).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd packages/simulation && bunx jest src/construction.spec.ts`
Expected: FAIL — `civ.pendingConstructions` is undefined and houses are built instantly (count > 0 after one month).

- [ ] **Step 3: Add the pending-construction state and pipeline**

In `packages/simulation/src/civilization.ts`:

Add the import (near the other type imports at the top):

```typescript
import type { CivilizationConfig, PendingConstruction } from './types/civilization'
```
(merge with the existing `import type { CivilizationConfig } from './types/civilization'` line — replace it with the line above.)

Add a public field on the class (next to `public config`), initialised in the constructor body. Add this line in the constructor body alongside `this._people = []`:

```typescript
    this.pendingConstructions = []
```

And declare the field on the class (right after the `mine`/getters block is fine, but a public field is simplest — add near the top of the class body, after `public id = v4()`):

```typescript
  public pendingConstructions: PendingConstruction[] = []
```

Add a `wall`-agnostic helper and the progress method (place near `constructBuilding`):

```typescript
  private startConstruction(buildingType: BuildingTypes, timeToBuild: number): void {
    this.pendingConstructions.push({
      buildingType,
      monthsRemaining: timeToBuild,
    })
  }

  private progressConstructions(): void {
    const completed: PendingConstruction[] = []
    for (const pending of this.pendingConstructions) {
      pending.monthsRemaining--
      if (pending.monthsRemaining <= 0) {
        completed.push(pending)
      }
    }

    for (const pending of completed) {
      this.constructBuilding(pending.buildingType)
    }

    this.pendingConstructions = this.pendingConstructions.filter(
      (pending) => pending.monthsRemaining > 0,
    )
  }
```

In `buildNewHouses`, replace the instant build:

```typescript
      worker.startBuilding()
      this.constructBuilding(BuildingTypes.HOUSE)
```
with:
```typescript
      worker.startBuilding(House.timeToBuild)
      this.startConstruction(BuildingTypes.HOUSE, House.timeToBuild)
```

In `buildNew`, replace the final instant build:

```typescript
    this.constructBuilding(buildingType)
```
with:
```typescript
    this.startConstruction(buildingType, timeToBuild)
```

In `passAMonth`, call the progress step before initiating new builds. Change:

```typescript
    this.adaptPeopleJob()
    this.buildNewBuilding()
```
to:
```typescript
    this.adaptPeopleJob()
    this.progressConstructions()
    this.buildNewBuilding()
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd packages/simulation && bunx jest src/construction.spec.ts`
Expected: PASS (both tests).

- [ ] **Step 5: Run the full simulation suite for regressions**

Run: `cd packages/simulation && bunx jest`
Expected: same baseline as before (only the pre-existing `civilization.spec.ts` load crash fails; everything else passes).

- [ ] **Step 6: Commit**

```bash
git add packages/simulation/src/civilization.ts packages/simulation/src/construction.spec.ts
git commit -m "feat(simulation): route all construction through pending pipeline"
```

---

### Task 3: Expose pending constructions (builder + formatter)

**Files:**
- Modify: `packages/simulation/src/builders/civilizationBuilder.ts`
- Modify: `packages/simulation/src/formatters/civilization.ts`
- Test: `packages/simulation/src/construction.spec.ts`

- [ ] **Step 1: Write the failing test**

Append to `packages/simulation/src/construction.spec.ts`:

```typescript
import { CivilizationBuilder } from './builders/civilizationBuilder'
import { formatCivilizations } from './formatters'

describe('pending construction round-trip', () => {
  it('builder restores pending constructions and formatter exposes them', () => {
    const civ = new CivilizationBuilder()
      .withName('Restored')
      .withPendingConstructions([
        { buildingType: BuildingTypes.MINE, monthsRemaining: 4 },
      ])
      .build()

    expect(civ.pendingConstructions).toEqual([
      { buildingType: BuildingTypes.MINE, monthsRemaining: 4 },
    ])

    const [formatted] = formatCivilizations([civ])
    expect(formatted.pendingConstructions).toEqual([
      { buildingType: BuildingTypes.MINE, monthsRemaining: 4 },
    ])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd packages/simulation && bunx jest src/construction.spec.ts -t "pending construction round-trip"`
Expected: FAIL — `withPendingConstructions` is not a function.

- [ ] **Step 3: Add builder method and formatter field**

In `packages/simulation/src/builders/civilizationBuilder.ts`, add the import:

```typescript
import type { PendingConstruction } from '../types/civilization'
```

Add a private field (next to `private config?`):

```typescript
  private pendingConstructions: PendingConstruction[] = []
```

Add the builder method (next to `withConfig`):

```typescript
  withPendingConstructions(pendingConstructions: PendingConstruction[]): this {
    this.pendingConstructions = pendingConstructions
    return this
  }
```

In `build()`, assign before the reset block (after the `config` assignment):

```typescript
    civilization.pendingConstructions = this.pendingConstructions
```

And reset it in the reset block (next to `this.config = undefined`):

```typescript
    this.pendingConstructions = []
```

In `packages/simulation/src/formatters/civilization.ts`, add the field to the mapped object (after `config`):

```typescript
    config: civilization.config,
    pendingConstructions: civilization.pendingConstructions,
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd packages/simulation && bunx jest src/construction.spec.ts -t "pending construction round-trip"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/simulation/src/builders/civilizationBuilder.ts packages/simulation/src/formatters/civilization.ts packages/simulation/src/construction.spec.ts
git commit -m "feat(simulation): expose pending constructions via builder and formatter"
```

---

### Task 4: Persist pending constructions (backend)

**Files:**
- Modify: `apps/back/db/schema/civilizationsModel.ts`
- Modify: `apps/back/src/modules/civilizations/service.ts`

- [ ] **Step 1: Add the schema field**

In `apps/back/db/schema/civilizationsModel.ts`, add to `civilizationSchema` (alongside `config`):

```typescript
    pendingConstructions: {
      type: [
        {
          buildingType: { type: String, required: true },
          monthsRemaining: { type: Number, required: true },
        },
      ],
      required: true,
      default: [],
    },
```

- [ ] **Step 2: Restore pending constructions in the mapper**

In `apps/back/src/modules/civilizations/service.ts`, inside `civilizationMapper`, after the `if (civilization.config) { builder.withConfig(...) }` block, add:

```typescript
  if (civilization.pendingConstructions?.length) {
    builder.withPendingConstructions(
      civilization.pendingConstructions.map(({ buildingType, monthsRemaining }) => ({
        buildingType,
        monthsRemaining,
      })),
    )
  }
```

- [ ] **Step 3: Persist pending constructions in `saveAll`**

In `apps/back/src/modules/civilizations/service.ts`, in the `CivilizationModel.findOneAndUpdate` update object inside `saveAll`, add the field (next to `livedMonths`):

```typescript
            livedMonths: civilization.livedMonths,
            pendingConstructions: civilization.pendingConstructions,
```

- [ ] **Step 4: Typecheck the changed backend files**

Run: `bunx tsc --noEmit -p apps/back/tsconfig.json`
Expected: no NEW errors in `service.ts` (the repo has pre-existing, unrelated tsc errors from the in-progress dependency migration; confirm none reference `service.ts` or `civilizationsModel.ts`).

- [ ] **Step 5: Commit**

```bash
git add apps/back/db/schema/civilizationsModel.ts apps/back/src/modules/civilizations/service.ts
git commit -m "feat(back): persist civilization pending constructions"
```

---

## Self-Review

- **Spec coverage:** Implements spec §2.2 (`pendingConstructions[]`) and §5.1 (uniform pipeline, cost at initiation, decrement, activation, mine capacity rolled at completion via `constructBuilding`). Wall-specific behaviour (§5.2), config fields, war, trade and objectives are out of scope for this plan (later plans).
- **Mine capacity at completion:** satisfied because `constructBuilding` creates a fresh `new Mine(1)` at activation, and the mine fix already removes exhausted mines so a fresh instance is constructed.
- **Migration:** schema default `[]` covers existing documents; mapper guards on `?.length`.
- **Type consistency:** `PendingConstruction` shape `{ buildingType, monthsRemaining }` is identical across type, builder, formatter, schema and service.
- **Balancing follow-up (tracked in spec §9/§11):** real delays on survival buildings (house `timeToBuild = 2`) may cause early mortality; revisit initial resources / life-loss rates after observing runs. Not blocking for this plan.
