import { DeathCause } from '@ajustor/simulation'

export const deathCauseNames: { [key in DeathCause]: string } = {
  [DeathCause.STARVATION]: 'Famine',
  [DeathCause.COLD]: 'Froid / exposition',
  [DeathCause.OLD_AGE]: 'Vieillesse',
  [DeathCause.WAR]: 'Guerre',
}
