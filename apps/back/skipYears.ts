import { CivilizationService } from './src/modules/civilizations/service'
import { WorldsTable } from './src/modules/world/database'
import { parseArgs } from "util"
import './src/libs/database'

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

console.log(`Prepare passing ${values.years} years`)


const worldDbClient = new WorldsTable()
const civilizationsDbClient = new CivilizationService()

const worlds = await worldDbClient.getAll()
for (const world of worlds) {

  const worldCivilizations = await civilizationsDbClient.getAllByWorldId(world.id, { people: true })
  world.addCivilization(...worldCivilizations.filter((civilization) => civilization.people.length).sort(() => Math.random() - 0.5))
  for (let i = 0; i < +values.years * 12; i++) {
    console.log(`Passing a month ${i}/${+values.years * 12 - 1}`)
    world.passAMonth()
  }
  await civilizationsDbClient.saveAll(worldCivilizations)
}

console.log('Civilizations saved, save the worlds')
try {
  await worldDbClient.saveAll(worlds)
  console.log('A month has passed')
  process.exit(0)
} catch (error) {
  console.error(error)
  process.exit(1)
}