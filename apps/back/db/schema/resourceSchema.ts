import { ResourceTypes } from '@ajustor/simulation'
import mongoose from 'mongoose'

const { Schema } = mongoose

export const ResourceSchema = new Schema({
  quantity: Number,
  resourceType: {
    type: String,
    enum: ResourceTypes
  }
})