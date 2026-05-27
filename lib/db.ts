import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI
const MONGODB_DB = process.env.MONGODB_DB

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env"
  )
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
// Augment the Node.js global to cache the Mongoose connection across hot reloads
declare global {
  // eslint is fine with this — it's a module augmentation, not runtime any
  var mongoose:
    | {
        conn: typeof import("mongoose") | null
        promise: Promise<typeof import("mongoose")> | null
      }
    | undefined
}

const cached = global.mongoose || { conn: null, promise: null }
global.mongoose = cached

async function dbConnect() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: MONGODB_DB,
    }

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default dbConnect
