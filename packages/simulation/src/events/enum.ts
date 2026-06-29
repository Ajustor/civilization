export enum Events {
  EARTHQUAKE = 'earthquake',
  STARVATION = 'starvation',
  MIGRATION = 'migration',
  FIRE =  'fire',
  RAT_INVASION = 'rat invasion',
  // Événements bénéfiques. Leur probabilité d'apparition est volontairement
  // inverse à l'ampleur du bonus offert (voir createNextEvent dans world.ts) :
  // plus le gain est important, plus l'événement est rare.
  BOUNTIFUL_HARVEST = 'bountiful harvest',
  TRADE_CARAVAN = 'trade caravan',
  FORTUNATE_DISCOVERY = 'fortunate discovery',
  GOLDEN_AGE = 'golden age',
}