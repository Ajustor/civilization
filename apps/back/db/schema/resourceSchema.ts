import { ResourceTypes } from '@ajustor/simulation'
import mongoose from 'mongoose'

const { Schema } = mongoose

const ResourceSchema = new Schema({
  quantity: Number,
  resourceType: {
    type: String,
    enum: ResourceTypes
  }
})

export { ResourceSchema }