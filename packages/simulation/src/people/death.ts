// Cause of a citizen's death. Kept deliberately small: these four cover every
// way the simulation can kill someone (lack of food, lack of heat/shelter,
// old age, and war casualties).
export enum DeathCause {
  STARVATION = 'starvation',
  COLD = 'cold',
  OLD_AGE = 'oldAge',
  WAR = 'war',
}

// Minimal record of a death, collected by a civilization during a month so it
// can be persisted to its cemetery. The month and civilization are stamped when
// the record is saved.
export type DeathRecord = {
  name: string
  cause: DeathCause
}
