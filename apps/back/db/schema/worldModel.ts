import mongoose from 'mongoose'

const { Schema } = mongoose

// Schéma pour World
const worldSchema = new Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    required: true,
    auto: true,
  },
  name: {
    type: String,
    unique: true,
    required: true
  },
  month: {
    type: Number,
    default: 0,
    required: true
  }
}, {
  timestamps: true
})

// Modèle Mongoose
export const World = mongoose.model('World', worldSchema);

