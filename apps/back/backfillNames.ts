import mongoose from 'mongoose'
import { names, uniqueNamesGenerator } from 'unique-names-generator'
import { PersonModel } from './src/libs/database/models'

const generateName = () => uniqueNamesGenerator({ dictionaries: [names] })

/**
 * One-off migration: assigns a stable name to every citizen created before the
 * `name` field existed. Run manually after deploying with:
 *   bun run backfillNames.ts
 * It is idempotent — already-named citizens are left untouched, so it is safe to
 * run more than once.
 */
async function backfillNames(): Promise<void> {
  const missingNameFilter = {
    $or: [{ name: { $exists: false } }, { name: null }, { name: '' }],
  }

  const total = await PersonModel.countDocuments(missingNameFilter)
  console.log(`${total} citizens without a name to backfill`)

  let processed = 0
  const BATCH_SIZE = 1000
  const cursor = PersonModel.find(missingNameFilter, '_id child')
    .batchSize(BATCH_SIZE)
    .cursor()

  let operations: Parameters<typeof PersonModel.bulkWrite>[0] = []

  const flush = async () => {
    if (!operations.length) {
      return
    }
    await PersonModel.bulkWrite(operations)
    processed += operations.length
    console.log(`  …${processed}/${total} updated`)
    operations = []
  }

  for await (const person of cursor) {
    const update: { name: string; 'child.name'?: string } = {
      name: generateName(),
    }

    // The unborn child is an embedded sub-document; give it a name too when it
    // exists and does not have one yet.
    const child = (person as unknown as { child?: { name?: string } | null }).child
    if (child && !child.name) {
      update['child.name'] = generateName()
    }

    operations.push({
      updateOne: {
        filter: { _id: person._id },
        update: { $set: update },
      },
    })

    if (operations.length >= BATCH_SIZE) {
      await flush()
    }
  }

  await flush()

  console.log(`Done. ${processed} citizens backfilled.`)
}

try {
  mongoose.connection.on(
    'error',
    console.error.bind(console, 'MongoDB connection error:'),
  )
  await mongoose.connect(Bun.env.mongoConnectString ?? '')

  console.log('MongoDB Connected')

  await backfillNames()

  process.exit(0)
} catch (e) {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
}
