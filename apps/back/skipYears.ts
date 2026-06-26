import { CivilizationService } from './src/modules/civilizations/service'
import { WorldsTable } from './src/modules/world/database'
import { parseArgs } from "util"
import './src/libs/database'
import { PeopleService } from './src/modules/people/service'
import { runMonthForWorld } from './src/modules/world/monthRunner'
import mongoose from 'mongoose'

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    years: {
      type: 'string',
    },
  },
  strict: true,
  allowPositionals: true,
})

if (!values.years) {
  process.exit(1)
}

console.time('skipYears')

console.timeLog('skipYears', `Prepare passing ${values.years} years`)


const worldDbClient = new WorldsTable()
const civilizationsDbClient = new CivilizationService(new PeopleService())

const monthsToPass = +values.years * 12

const worlds = await worldDbClient.getAll()
for (const world of worlds) {
  // Replay the exact production monthly tick for each month: reload the alive
  // civilizations, simulate one month, then persist their stats and state.
  // Doing it month by month (instead of simulating many months on stale, never
  // reloaded instances) keeps the outcome identical to the regular cron, which
  // is what keeps the civilizations alive.
  for (let i = 0; i < monthsToPass; i++) {
    console.timeLog('skipYears', `Passing a month ${i + 1}/${monthsToPass}`)
    await runMonthForWorld(world, civilizationsDbClient)
  }
}

console.timeLog('skipYears', 'Civilizations saved, save the worlds')
try {
  await worldDbClient.saveAll(worlds)
  console.timeEnd('skipYears')
  await mongoose.disconnect()
  process.exit(0)
} catch (error) {
  console.error(error)
  process.exit(1)
}
