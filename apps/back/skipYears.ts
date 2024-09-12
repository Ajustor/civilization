import { parseArgs } from "util"
import { db } from './src/libs/database'
import { CivilizationTable } from './src/modules/civilizations/database'
import { WorldsTable } from './src/modules/world/database'

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

for (let i = 0; i < +values.years * 12; i++) {

  const worldDbClient = new WorldsTable(db)
  const civilizationsDbClient = new CivilizationTable(db)

  const worlds = await worldDbClient.getAll()
  console.log('Worlds retrieved, start passing a month')
  for (const world of worlds) {
    const worldCivilizations = await civilizationsDbClient.getAllByWorldId(world.id)
    world.addCivilization(...worldCivilizations.filter((civilization) => civilization.citizens.length).sort(() => Math.random() - 0.5))
    world.passAMonth()
    await civilizationsDbClient.saveAll(worldCivilizations)
  }

  console.log('Civilizations saved, save the worlds')
  try {
    await worldDbClient.saveAll(worlds)
    console.log('A month has passed')
  } catch (error) {
    console.error(error)
  }

}