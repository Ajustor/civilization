import { Schema } from 'mongoose'

// Web Push (VAPID) subscription as returned by the browser PushManager. Stored
// per user so the backend can push attack notifications to every device the
// player has enabled.
const PushSubscriptionSchema = new Schema(
  {
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { _id: false },
)

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
  }],
  pushSubscriptions: {
    type: [PushSubscriptionSchema],
    required: true,
    default: [],
  }
})

