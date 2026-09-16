import { EventEmitter } from "events"

// Ensure the EventEmitter is cached globally so it persists across hot-reloads in development
// and multiple API route executions in production (assuming a single Node instance).
const globalForEvents = global as unknown as { eventBus: EventEmitter }

export const eventBus = globalForEvents.eventBus || new EventEmitter()

if (process.env.NODE_ENV !== "production") {
  globalForEvents.eventBus = eventBus
}

// Set max listeners higher to avoid warnings if multiple users have tabs open
eventBus.setMaxListeners(100)
