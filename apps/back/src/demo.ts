import { select, input } from '@inquirer/prompts'

import { Civilization } from './simulation/civilization'
import { Citizen } from './simulation/citizen/citizen'
import { Resource, ResourceType } from './simulation/resource'
import { World } from './simulation/world'
import { ProfessionType } from './simulation/citizen/work/enum'

const world = new World()
const myCivilization = new Civilization()

world.addCivilization(myCivilization)

const alice = new Citizen('Alice', 5, 3)
const bob = new Citizen('Bob', 2, 3)

alice.setProfession(ProfessionType.FARMER)
bob.setProfession(ProfessionType.CARPENTER)

// Adding some citizens
myCivilization.addCitizen(alice)
myCivilization.addCitizen(bob)

// Adding some resources
myCivilization.addResource(new Resource(ResourceType.FOOD, 5))
myCivilization.addResource(new Resource(ResourceType.WOOD, 0))  // Start with no wood

console.log(`Initial config:
  ${myCivilization.getCivilizationInfos()}
`)


function nextYear() {
  world.passAMonth()
  console.log(`---- Year: ${world.getYear()} ----`)
  console.log(myCivilization.getCivilizationInfos())
}

async function promptUser() {
  const command = await select(
    {
      message: 'Enter command:',
      choices: [{ name: 'Next Year', value: 'next' }, { name: 'Display Status', value: 'year' }, { name: 'Adapt citizens', value: 'adapt' }, { name: 'Pass a few years', value: 'pass' }, { name: 'Quit', value: 'quit' }],
    }
  )

  let numberOfYearsToPass: number = 1

  if (command === 'pass') {
    numberOfYearsToPass = +await input({
      message: 'Select the number or years you want to pass',
      default: '0',
      validate(value) {
        if (Number.isNaN(value)) {
          return 'Please enter a number'
        }
        return true
      },
    })
  }
  console.clear()

  switch (command.trim().toLowerCase()) {
    case 'year':
      console.log(myCivilization.getCivilizationInfos())
      break
    case 'quit':
      process.exit(0)
    case 'adapt':
      myCivilization.adaptCitizen()
      console.log(myCivilization.getCivilizationInfos())
      break
    case 'pass':
      if (Number.isNaN(numberOfYearsToPass)) {
        console.error('please use a number in pass command')
        break
      }
      for (let i = 0; i < numberOfYearsToPass; i++) {
        nextYear()
      }
      break
    case 'next':
    default:
      nextYear()
  }
  console.log(world.getInfosFormated())
  promptUser()

}

console.clear()
console.log(`Initial config:
  ${myCivilization.getCivilizationInfos()}
`)
promptUser()
