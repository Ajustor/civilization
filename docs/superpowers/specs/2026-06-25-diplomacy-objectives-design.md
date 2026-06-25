# Design — Diplomatie, Guerre & Objectifs

Date : 2026-06-25
Branche : `feat/external-config`
Statut : en revue

## 1. Contexte & objectifs

Le jeu est une simulation « watcher » multi-utilisateurs : des civilisations partagent
un monde, évoluent automatiquement chaque mois (cron `passAMonth`), et les joueurs
les créent/configurent via l'app web. L'échange mutuel de ressources
(`OPEN_EXCHANGE`) est déjà en place comme première interaction inter-civ.

Cette spec ajoute, dans **une seule passe**, trois axes de gameplay :

1. **Commerce actif** entre joueurs (offres / acceptation).
2. **Guerre** : agression unilatérale, soldats, batailles (pertes + pillage + capture),
   et un bâtiment défensif **muraille**.
3. **Objectifs / prestige** : badges cosmétiques + score.

Plus deux changements transverses : un **système de construction uniforme** (plus
aucun bâtiment instantané — tout passe par un délai `timeToBuild`), et un levier
joueur pour **choisir le prochain bâtiment à construire**.

Non-objectifs (v1) : carte/territoire, marché global inter-mondes, bonus de gameplay
liés aux objectifs, IA de décision de guerre.

## 2. Modèle de données

### 2.1 Config civilisation (`ConfigSchema` + `CivilizationConfig`)
Nouveaux champs (UPPER_SNAKE en DB, camelCase exposé via le DTO comme l'existant) :

- `MILITARY_RATIO: number` (0–100, défaut 0) — part des adultes actifs entretenus
  comme soldats.
- `AT_WAR_WITH: string[]` (ObjectId refs `Civilization`, défaut `[]`) — cibles
  d'agression unilatérale.
- `NEXT_BUILDING_TO_BUILD: BuildingType | null` (défaut `null`) — bâtiment choisi par
  le joueur, construit en priorité jusqu'à réussite, puis remis à `null`.

Le DTO `UpdateCivilizationDto` est étendu (`militaryRatio`, `atWarWith`,
`nextBuildingToBuild`) et `CivilizationService.update` mappe ces champs comme les
existants (avec fallback `defaultCivilizationConfig`).

### 2.2 Bâtiments en cours de construction
La civilisation gagne :

- `pendingConstructions: { buildingType: BuildingTypes; monthsRemaining: number }[]`
  (défaut `[]`)

Persisté sur le document civilisation. **Tous** les bâtiments passent par ce
pipeline (voir §5) — plusieurs chantiers peuvent coexister (maisons, ferme…). Le
nombre de chantiers simultanés est naturellement borné par les ouvriers disponibles
(`startBuilding` les occupe le temps du chantier).

### 2.3 Objectifs / prestige (sur la civilisation)
- `achievements: { key: string; unlockedAtMonth: number }[]` (défaut `[]`)
- `prestige: number` (défaut 0)

### 2.4 Nouveau modèle `TradeOffer` (collection dédiée)
```
{
  worldId: ObjectId,
  fromCivilizationId: ObjectId,
  toCivilizationId?: ObjectId,        // absent => offre ouverte au marché du monde
  give:  { resourceType: ResourceTypes; quantity: number }[],
  want:  { resourceType: ResourceTypes; quantity: number }[],
  status: 'open' | 'accepted' | 'cancelled',
  acceptedByCivilizationId?: ObjectId,
  createdAt, updatedAt
}
```

## 3. Commerce (action joueur, hors tick)

Flux *offre → acceptation*, exécuté **immédiatement via l'API** (jamais dans la
simulation) :

1. Le joueur poste une offre depuis une de ses civs (`give` contre `want`), ciblée
   (`toCivilizationId`) ou ouverte au monde.
2. Les offres `open` du monde sont visibles par les autres joueurs.
3. À l'acceptation par une civ B (appartenant à l'utilisateur acceptant) :
   - Validation : l'offre est `open` (non expirée/annulée) ; A possède `give` ;
     B possède `want` ; B respecte la cible si l'offre est ciblée.
   - Swap atomique des ressources entre A et B (A perd `give`/gagne `want`,
     B l'inverse).
   - L'offre passe `accepted` (`acceptedByCivilizationId = B`).
   - Sinon → erreur explicite (offre invalide / ressources insuffisantes).
4. Le créateur peut `cancel` une offre `open`.

**Concurrence** : la validation des stocks se fait au moment de l'exécution ; si une
ressource manque (parce que le cron a consommé entre-temps), l'acceptation échoue
proprement.

### Endpoints (module Elysia `trade-offers`)
- `POST /civilizations/:civilizationId/trade-offers` (auth : propriétaire de la civ)
- `GET  /worlds/:worldId/trade-offers?status=open`
- `POST /trade-offers/:offerId/accept` (body : `{ civilizationId }` de l'acquéreur)
- `DELETE /trade-offers/:offerId` (créateur uniquement)

### Front
- Page « Marché » du monde : liste des offres ouvertes + acceptation.
- Section « Mes offres » sur la page civ : création + annulation.

L'échange passif automatique (`OPEN_EXCHANGE`) est conservé tel quel (alliance
pacifique) ; le commerce d'offres est l'interaction active.

## 4. Guerre (résolue dans le tick)

### 4.1 Soldats
- Nouvelle occupation `OccupationTypes.SOLDIER` + classe `Soldier implements
  UpgradedWork` (ne collecte/produit rien → vrai coût économique).
- `adaptPeopleJob` recrute des adultes valides vers `SOLDIER` jusqu'à atteindre
  `MILITARY_RATIO` % des adultes actifs (et libère le surplus si le ratio baisse).

### 4.2 Résolution — `World.resolveWars()`
Nouvelle phase appelée dans `World.passAMonth` (à côté de `exchangeResources`,
avant le tick des civilisations). Itère sur chaque **attaque dirigée** : pour chaque
civ A et chaque cible `B ∈ A.config.AT_WAR_WITH` présente dans le monde :

- **Si B a une muraille active** → l'attaque est **bloquée** (aucune perte/pillage/
  capture côté B) et la **muraille de B est détruite** (consommée).
- **Sinon → bataille** (logique pure dans `combat.ts`, testable isolément) :
  - `force(civ) = Σ soldats vivants pondérés par leur santé (lifeCounter)`.
  - Les deux camps perdent des soldats proportionnellement à la force adverse.
  - Le vainqueur (force la plus élevée) :
    - **pille** `PLUNDER_RATIO` % des ressources de B,
    - **capture** `min(CAPTURE_RATIO % de la pop de B, CAPTURE_CAP)` habitants,
      déplacés vers A (lignée conservée ; soumis ensuite au logement de A).
  - Sans soldats, une civ est sans défense : pertes civiles + pillage/capture
    aggravés.

Si A et B se ciblent mutuellement, deux attaques dirigées sont résolues (chacun
défend avec sa propre muraille).

## 5. Système de construction uniforme

### 5.1 Pipeline unique (tous les bâtiments)
**Tous** les bâtiments sont construits via le même pipeline — plus aucune
construction instantanée :

- L'initiation d'un chantier (par `buildNew` / `buildNewHouses` / le choix joueur)
  **paie le coût en ressources immédiatement**, occupe les ouvriers
  (`startBuilding(timeToBuild)`), et ajoute une entrée
  `{ buildingType, monthsRemaining = building.timeToBuild }` à `pendingConstructions`.
- Chaque `passAMonth` décrémente tous les `monthsRemaining` ; à 0, le bâtiment
  devient actif via `constructBuilding` (pour la mine, la capacité aléatoire est
  tirée **à l'achèvement**) et l'entrée est retirée.
- `timeToBuild` est défini et **≥ 1** pour chaque type (la valeur statique existe
  déjà pour la plupart ; il faut l'ajouter à `House`).

**Conséquence d'équilibrage assumée** : les bâtiments vitaux (maison, feu, ferme)
n'étant plus instantanés, attendre s'accompagne de pics de mortalité (sans-abri,
faim, froid) en début de partie. À rééquilibrer via les stocks/bâtiments initiaux,
les `timeToBuild` et éventuellement les taux de perte de vie (§9).

### 5.2 Muraille (`BuildingTypes.WALL`)
La muraille n'est plus un cas particulier : c'est un bâtiment comme les autres dans
le pipeline §5.1, avec :
- Bâtiment **unique** (count max 1).
- `Wall.timeToBuild = 12` (mois).
- `Wall.minBuilders = 250` — la civ doit avoir ≥ 250 citoyens `canWork()` (adultes
  valides) pour **démarrer** le chantier ; sinon la demande reste en attente.
- `Wall.constructionCosts = [{ STONE, 2000 }, { WOOD, 1500 }]` (équilibrage initial,
  ajustable).
- **Défense consommable** : bloque une attaque puis est détruite (count → 0) ;
  reconstruction = un nouveau chantier d'un an.

## 6. Bâtiment choisi par le joueur (`NEXT_BUILDING_TO_BUILD`)

Dans `buildNewBuilding` (avant la construction aléatoire existante) : si
`NEXT_BUILDING_TO_BUILD` est défini, la civ tente en **priorité** d'initier son
chantier (coûts, ouvriers, préconditions comme `minBuilders` pour la muraille). Dès
que le chantier est **lancé** (entrée ajoutée à `pendingConstructions`), le champ
repasse `null`. Si les conditions ne sont pas réunies, la demande **persiste** au tick
suivant.

## 7. Objectifs / prestige (cosmétique)

- Définitions statiques : `achievements/definitions.ts` —
  `{ key, label, points, predicate(civilization, world) }`. Set initial :
  survivre 10 / 50 / 100 ans, atteindre 100 / 500 habitants, posséder au moins un de
  chaque type de bâtiment, gagner une bataille, réaliser un échange commercial, ouvrir
  une alliance (`OPEN_EXCHANGE`), construire une muraille.
- `achievements/evaluate.ts` (pur) : retourne les clés nouvellement remplies pour une
  civ. Appelé dans le tick (là où on construit déjà les stats), ajoute à
  `civ.achievements` avec le mois courant.
- `prestige = Σ points des achievements (+ petit bonus par année vécue)`.
- Front : section « Objectifs » sur la page civ (badges débloqués/verrouillés) +
  prestige affiché ; tri par prestige sur la liste des civs.

## 8. Découpage / fichiers

**Simulation (`packages/simulation`)**
- `people/work/soldier.ts` (`Soldier`), `SOLDIER` dans `enum.ts`.
- `buildings/wall.ts` (`Wall`), `WALL` dans `buildings/enum.ts` + `BUILDING_CONSTRUCTORS`.
- `combat.ts` — résolution de bataille pure.
- `achievements/definitions.ts`, `achievements/evaluate.ts`.
- `civilization.ts` : `pendingConstructions[]` ; router `buildNew` /
  `buildNewHouses` (et toute construction) par le pipeline §5.1 (plus de
  `constructBuilding` immédiat hors achèvement) ; décrément/achèvement des chantiers
  dans `passAMonth` ; recrutement soldats dans `adaptPeopleJob` ; priorité
  `NEXT_BUILDING_TO_BUILD` dans `buildNewBuilding` ; getter `wall`.
- `world.ts` : `resolveWars()`.
- `types/civilization.ts` : champs de config.
- `buildings/house.ts` : ajouter `timeToBuild`.
- `formatters/civilization.ts` : exposer `pendingConstructions`, `achievements`,
  `prestige`.

**Back (`apps/back`)**
- `db/schema/civilizationsModel.ts` : champs config, `pendingConstruction`,
  `achievements`, `prestige`.
- `db/schema/tradeOfferModel.ts` + `modules/trade-offers/` (service + module Elysia).
- `modules/civilizations/dto.ts` + `service.update` : nouveaux champs.
- `modules/world/monthRunner.ts` : évaluation des objectifs après `passAMonth`.

**Front (`apps/front`)**
- Page marché (`routes/worlds/[id]/market` ou équivalent) + service API trade-offers.
- Page config civ : `militaryRatio`, `atWarWith` (multi-select), `nextBuildingToBuild`
  (select).
- Page civ : sections « Objectifs » et « Mes offres ».

## 9. Constantes d'équilibrage (modifiables)

- `PLUNDER_RATIO = 25 %`, `CAPTURE_RATIO = 5 %`, `CAPTURE_CAP` = plafond raisonnable
  (ex. 100).
- `Wall` : 12 mois, 250 bâtisseurs, 2000 pierre + 1500 bois.
- Pondération de force soldat par `lifeCounter`.
- `timeToBuild` par type (≥ 1) — à calibrer : court pour les évolutions de base,
  long pour l'évolué (mine 10, muraille 12) ; `House.timeToBuild` à définir.
- Survie sous délais réels : ajuster stocks/bâtiments initiaux d'une civ et/ou les
  taux de perte de vie pour absorber les pics de mortalité de début de partie.

## 10. Tests

- `combat.spec.ts` : asymétrie de force, pertes des deux camps, pillage, capture,
  blocage par muraille (consommation).
- Pipeline de construction uniforme : initiation (coût payé, ouvriers occupés, entrée
  ajoutée à `pendingConstructions`), décompte, achèvement (bâtiment actif, capacité de
  mine tirée à l'achèvement), chantiers concurrents.
- `wall` : démarrage conditionné aux 250 bâtisseurs, décompte 12 mois, activation,
  consommation à l'attaque.
- `achievements/evaluate.spec.ts` : prédicats purs.
- `tradeOfferService` : validations (stocks, cible, statut) et swap.
- `world.resolveWars` : intégration via `World` (le spec `world.spec.ts` se lance,
  contrairement à `civilization.spec.ts` qui crashe au chargement — bug d'outillage
  `source-map` pré-existant ; privilégier les unités pures et `world.spec`).

## 11. Risques / points ouverts

- Griefing inter-joueurs via l'agression unilatérale (acceptable v1, à surveiller).
- Concurrence cron ↔ acceptation d'offre (mitigée par validation à l'exécution).
- Coût de persistance des captures (déplacement de personnes entre civs) à vérifier
  vis-à-vis du `saveAll`.
- Délais réels sur les bâtiments vitaux : risque de pics de mortalité (sans-abri,
  faim, froid) en début de partie ; nécessite un passage de rééquilibrage (stocks
  initiaux, `timeToBuild`, taux de perte de vie) et une observation des courbes.
- `pendingConstructions` doit être migré sur les civilisations existantes (défaut
  `[]`) ; idem capacité de mine désormais tirée à l'achèvement.
