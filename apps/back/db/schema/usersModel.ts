import { Schema } from 'mongoose'

export const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  password: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  authorizationKey: String,
  civilizations: [{
    type: Schema.Types.ObjectId,
    ref: 'Civilization'
  }]
})

