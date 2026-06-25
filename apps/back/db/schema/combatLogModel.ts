import { Schema } from 'mongoose'

const PlunderedResourceSchema = new Schema(
  {
    type: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false },
)

export const combatLogSchema = new Schema(
  {
    battleId: { type: String, required: true },
    worldId: { type: Schema.Types.ObjectId, ref: 'World', required: true },
    civilizationId: { type: Schema.Types.ObjectId, ref: 'Civilization', required: true },
    role: { type: String, enum: ['attacker', 'defender'], required: true },
    opponentCivId: { type: Schema.Types.ObjectId, ref: 'Civilization', required: true },
    opponentName: { type: String, required: true },
    month: { type: Number, required: true },
    attackerStrength: { type: Number, required: true },
    defenderStrength: { type: Number, required: true },
    attackerWins: { type: Boolean, required: true },
    myLossRatio: { type: Number, required: true },
    opponentLossRatio: { type: Number, required: true },
    plunderedResources: { type: [PlunderedResourceSchema], default: [] },
    captivesTaken: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
)

combatLogSchema.index({ civilizationId: 1, createdAt: -1 })
