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

### Starvation

### Migration
* outgoing migration
  * Up to MAXIMUM_OUTGOING_PEOPLE_RATE are removed from the population
  * Only retired and working people can go

* incoming migration :
  * Up to MAXIMUM_INCOMING_PEOPLE_RATE are added to population.
  * The rate is computed using ALL alive people.
  * The population limitation is overidden
  * Incoming people age / health / occupation are randomised


This project was created using `bun init` in bun v1.1.22. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
