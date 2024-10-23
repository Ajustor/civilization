import { CivilizationService } from './src/modules/civilizations/service'
import { WorldsTable } from './src/modules/world/database'
import { parseArgs } from "util"
import './src/libs/database'
import { PeopleService } from './src/modules/people/service'

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

const worlds = await worldDbClient.getAll()
for (const world of worlds) {

  for (let i = 0; i < +values.years * 12; i++) {
    const worldCivilizations = await civilizationsDbClient.getAllByWorldId(world.id, { people: true })
    world.addCivilization(...worldCivilizations.filter((civilization) => civilization.people.length).sort(() => Math.random() - 0.5))
    console.timeLog('skipYears', `Passing a month ${i}/${+values.years * 12 - 1}`)
    await world.passAMonth()
    await civilizationsDbClient.saveAll(worldCivilizations)
    world['_civilizations'] = []
  }
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