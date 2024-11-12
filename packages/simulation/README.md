# @ajustor/simulation

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run src/index.ts
```
## Events 

### Earthquake
* For each civilisation, a random quantity of building will be destroyed (up to the total number of building)
* For each different building type, a random number of building will be destroyed until the total number is destroyed

### Starvation
* World :
  * A random quantity of food will disappear

* Civilisation :
  * A random quantity of food will be consumed

### Migration
* apply only if civilization people is greater than 100
* outgoing migration
  * Up to MAXIMUM_OUTGOING_PEOPLE_RATE are removed from the population
  * Only retired and working people can go

* incoming migration :
  * Up to MAXIMUM_INCOMING_PEOPLE_RATE are added to population.
  * The rate is computed using ALL alive people.
  * The population limitation is overidden
  * Incoming people age / health / occupation are randomised

### Fire
* Every wood resources in civilizations are destroyed

### Rat invasion
* Every food resources in civilizations are destroyed

This project was created using `bun init` in bun v1.1.22. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
