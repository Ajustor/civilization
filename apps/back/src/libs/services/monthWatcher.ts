import { EventEmitter } from 'node:events'
import { WorldModel } from '../database/models'

/**
 * Months are advanced every ~15 minutes by a separate process (`cron/passAMonth`),
 * so the HTTP server cannot be notified in-process. Instead this singleton polls
 * each world's `month` on a slow interval and emits an event when it changes, which
 * the SSE endpoint (`GET /worlds/:worldId/events`) relays to connected browsers.
 *
 * Polling (rather than MongoDB change streams) keeps it working on a standalone
 * Mongo instance with no replica set. At a 30s cadence against a 15-minute tick the
 * cost is negligible and the on-screen refresh lands within half a minute.
 */
class MonthWatcher {
  private readonly emitter = new EventEmitter()
  private readonly months = new Map<string, number>()
  private started = false
  private timer: ReturnType<typeof setInterval> | null = null
  private readonly POLL_MS = 30_000

  private start() {
    if (this.started) {
      return
    }
    this.started = true
    // No upper bound on concurrent SSE subscribers.
    this.emitter.setMaxListeners(0)
    void this.poll()
    this.timer = setInterval(() => void this.poll(), this.POLL_MS)
  }

  private async poll() {
    try {
      const worlds = await WorldModel.find({}, 'month').lean()
      for (const world of worlds) {
        const worldId = String(world._id)
        const month = (world as { month?: number }).month ?? 0
        const previous = this.months.get(worldId)
        this.months.set(worldId, month)
        // Skip the first observation so subscribers are not refreshed on connect.
        if (previous !== undefined && month !== previous) {
          this.emitter.emit(worldId, month)
        }
      }
    } catch (error) {
      console.error('[MonthWatcher] poll failed', error)
    }
  }

  /**
   * Subscribes to month changes for a world. Starts the poller lazily on the first
   * subscription. Returns an unsubscribe function.
   */
  onWorldMonthChange(worldId: string, listener: (month: number) => void): () => void {
    this.start()
    this.emitter.on(worldId, listener)
    return () => this.emitter.off(worldId, listener)
  }
}

export const monthWatcher = new MonthWatcher()
