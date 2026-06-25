import { CivilizationService } from './src/modules/civilizations/service'
import { WorldsTable } from './src/modules/world/database'
import { parseArgs } from "util"
import './src/libs/database'
import { PeopleService } from './src/modules/people/service'
import { attachAliveCivilizations } from './src/modules/world/monthRunner'

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
  // Attach civilizations once, then simulate every month on the same instances.
  const worldCivilizations = await attachAliveCivilizations(
    world,
    civilizationsDbClient,
  )

  for (let i = 0; i < monthsToPass; i++) {
    console.timeLog('skipYears', `Passing a month ${i}/${monthsToPass - 1}`)
    await world.passAMonth()
  }

  await civilizationsDbClient.saveAll(worldCivilizations)
}

console.timeLog('skipYears', 'Civilizations saved, save the worlds')
try {
  await worldDbClient.saveAll(worlds)
  console.timeEnd('skipYears')
  process.exit(0)
} catch (error) {
  console.error(error)
  process.exit(1)
}
