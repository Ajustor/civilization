import mongoose from 'mongoose'

mongoose.connect(Bun.env.mongoConnectString ?? '')
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'))