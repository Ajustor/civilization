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

// Compteurs cumulés de décès par cause, un document par civilisation. Les tombes
// sont élaguées au-delà d'un plafond (GRAVES_PER_CIVILIZATION), donc le bilan du
// cimetière ne peut pas être recalculé depuis les stèles conservées : ce document
// garde le décompte complet depuis la fondation.
export const cemeteryStatsSchema = new Schema(
  {
    civilizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Civilization',
      required: true,
      unique: true,
    },
    causes: { type: Map, of: Number, default: {} },
  },
  { timestamps: true },
)
