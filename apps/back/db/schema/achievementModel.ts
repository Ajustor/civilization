import { Schema } from 'mongoose'

// Un document par succès débloqué par une civilisation. Le catalogue (nom,
// description, points) vit dans @ajustor/simulation : on ne persiste que le
// déblocage. Un succès reste acquis même si sa condition cesse d'être vraie.
export const achievementSchema = new Schema(
  {
    civilizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Civilization',
      required: true,
    },
    achievementId: { type: String, required: true },
    // Mois du monde au moment du déblocage (absent pour les succès accordés
    // hors du tick mensuel, ex. la fondation d'une colonie).
    month: { type: Number },
  },
  { timestamps: true },
)

// Un même succès ne peut être débloqué qu'une fois par civilisation.
achievementSchema.index({ civilizationId: 1, achievementId: 1 }, { unique: true })
