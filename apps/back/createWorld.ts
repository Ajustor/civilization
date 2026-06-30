/**
 * Crée un nouveau monde dans la base — sans rien supprimer d'existant.
 *
 * Contrairement à `createANewWorld.ts` (qui réinitialise tout et notifie les
 * joueurs d'une fin de monde), ce script est purement additif : il insère un
 * monde supplémentaire avec les paramètres fournis.
 *
 * Usage :
 *   bun run create:world --name "Mon Monde"
 *   bun run create:world --name "Terra" --event-chance 25 --raw-food 20000 --month 0
 *
 * Tous les paramètres ont une valeur par défaut (alignée sur la config par
 * défaut de la simulation) sauf --name, obligatoire et unique.
 *
 * Paramètres :
 *   --name                (obligatoire) nom unique du monde
 *   --month               mois de départ                       (défaut 0)
 *   --food-generation     config.BASE_FOOD_GENERATION          (défaut 30000)
 *   --wood-generation     config.BASE_WOOD_GENERATION          (défaut 15000)
 *   --event-chance        config.EVENT_CHANCE (% / mois)       (défaut 30)
 *   --speed-mode-months   config.SPEED_MODE_MONTHS             (défaut 12)
 *   --raw-food            ressource initiale RAW_FOOD          (défaut 10000)
 *   --wood                ressource initiale WOOD              (défaut 5000)
 *   --stone               ressource initiale STONE             (défaut 5000)
 *   --help                affiche cette aide
 */
import mongoose from 'mongoose'
import { parseArgs } from 'node:util'

import { ResourceTypes } from '@ajustor/simulation'

import { WorldModel } from './src/libs/database/models'

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  allowPositionals: true,
  options: {
    name: { type: 'string' },
    month: { type: 'string', default: '0' },
    'food-generation': { type: 'string', default: '30000' },
    'wood-generation': { type: 'string', default: '15000' },
    'event-chance': { type: 'string', default: '30' },
    'speed-mode-months': { type: 'string', default: '12' },
    'raw-food': { type: 'string', default: '10000' },
    wood: { type: 'string', default: '5000' },
    stone: { type: 'string', default: '5000' },
    help: { type: 'boolean', default: false },
  },
})

const usage = `Crée un nouveau monde (additif, ne supprime rien).

Usage : bun run create:world --name "Mon Monde" [options]

Options :
  --name <string>            (obligatoire) nom unique du monde
  --month <number>           mois de départ                  (défaut 0)
  --food-generation <number> BASE_FOOD_GENERATION            (défaut 30000)
  --wood-generation <number> BASE_WOOD_GENERATION            (défaut 15000)
  --event-chance <number>    EVENT_CHANCE (% par mois)       (défaut 30)
  --speed-mode-months <num>  SPEED_MODE_MONTHS               (défaut 12)
  --raw-food <number>        ressource initiale RAW_FOOD     (défaut 10000)
  --wood <number>            ressource initiale WOOD         (défaut 5000)
  --stone <number>           ressource initiale STONE        (défaut 5000)
  --help                     affiche cette aide`

if (values.help) {
  console.log(usage)
  process.exit(0)
}

const name = values.name?.trim()
if (!name) {
  console.error('❌ --name est obligatoire.\n')
  console.error(usage)
  process.exit(1)
}

// parseArgs ne gère que des chaînes : on convertit en nombre avec validation
// pour éviter d'insérer un NaN en base.
const toNumber = (label: string, raw: string): number => {
  const value = Number(raw)
  if (!Number.isFinite(value)) {
    console.error(`❌ Valeur numérique invalide pour ${label} : "${raw}"`)
    process.exit(1)
  }
  return value
}

const month = toNumber('--month', values.month!)
const config = {
  BASE_FOOD_GENERATION: toNumber('--food-generation', values['food-generation']!),
  BASE_WOOD_GENERATION: toNumber('--wood-generation', values['wood-generation']!),
  EVENT_CHANCE: toNumber('--event-chance', values['event-chance']!),
  SPEED_MODE_MONTHS: toNumber('--speed-mode-months', values['speed-mode-months']!),
}
const resources = [
  { resourceType: ResourceTypes.RAW_FOOD, quantity: toNumber('--raw-food', values['raw-food']!) },
  { resourceType: ResourceTypes.WOOD, quantity: toNumber('--wood', values.wood!) },
  { resourceType: ResourceTypes.STONE, quantity: toNumber('--stone', values.stone!) },
]

try {
  mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'))
  await mongoose.connect(Bun.env.mongoConnectString ?? '')
  console.log('MongoDB connecté')

  const existing = await WorldModel.findOne({ name })
  if (existing) {
    console.error(`❌ Un monde nommé "${name}" existe déjà (id: ${existing.id}). Choisis un autre nom.`)
    process.exit(1)
  }

  const world = await WorldModel.create({ name, month, resources, config })

  console.log(`✅ Monde créé : "${world.name}" (id: ${world.id})`)
  console.log(`   mois de départ : ${month}`)
  console.log(`   config         : ${JSON.stringify(config)}`)
  console.log(
    `   ressources     : RAW_FOOD=${resources[0].quantity}, WOOD=${resources[1].quantity}, STONE=${resources[2].quantity}`,
  )
  process.exit(0)
} catch (error) {
  console.error('❌ Échec de la création du monde :', error instanceof Error ? error.message : error)
  process.exit(1)
}
