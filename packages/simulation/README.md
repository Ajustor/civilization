# @ajustor/simulation

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run src/index.ts
```

## Buildings

## Events

### Earthquake

- For each civilisation, a random quantity of building will be destroyed (up to the total number of building)
- For each different building type, a random number of building will be destroyed until the total number is destroyed

### Starvation

- World :

  - A random quantity of food will disappear

- Civilisation :
  - A random quantity of food will be consumed

### Migration

- apply only if civilization population is greater than 100
- People are taken from existing civilization to be added in another one
- outgoing migration :

  - Up to `MAXIMUM_OUTGOING_PEOPLE_RATE` are going away

- incoming migration :

  - Up to `MAXIMUM_INCOMING_PEOPLE_RATE` are added to population.
  - The rate is computed using ALL alive people.
  - The population limitation is overidden

- Attractiveness of a civilization is `(RAW_FOOD + (COOKED_FOOD * 2) ) / population`. The higher, the better.
- After processing the last wave of migration, citizens without civilization disappear from the kingdom.
- Potentially, people can go back to their homeland during a migration

### Fire

- Every wood resources that is not in a storage building is destroyed

### Rat invasion

- Every food resources that is not in a storage building is destroyed

This project was created using `bun init` in bun v1.1.22. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
