import { Schema } from 'mongoose'
import { DeathCause } from '@ajustor/simulation'

// One grave per dead citizen. Deliberately minimal: who died, of what, and when.
export const graveSchema = new Schema(
  {
    civilizationId: { type: Schema.Types.ObjectId, ref: 'Civilization', required: true },
    name: { type: String, required: true },
    cause: { type: String, enum: Object.values(DeathCause), required: true },
    month: { type: Number, required: true },
    // Âge (en mois) du citoyen à sa mort. Optionnel : les tombes créées avant
    // cette fonctionnalité n'en ont pas.
    ageAtDeath: { type: Number },
  },
  { timestamps: true },
)

graveSchema.index({ civilizationId: 1, createdAt: -1 })
