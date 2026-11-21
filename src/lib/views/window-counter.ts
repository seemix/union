/**
 * Bounded fixed-window counters: at most `limit` hits per key per `windowMs`.
 * Same single-process assumption as `TtlCache` (src/lib/cache/ttl-cache.ts).
 */
export class WindowCounter {
  private readonly windows = new Map<string, { start: number; count: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly maxKeys: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** `true` and counts the hit if `key` is still under its limit in the current window. */
  take(key: string): boolean {
    const t = this.now();
    let w = this.windows.get(key);
    if (!w || t - w.start >= this.windowMs) {
      this.windows.delete(key); // re-insert → newest in Map order
      w = { start: t, count: 0 };
      this.windows.set(key, w);
      while (this.windows.size > this.maxKeys) {
        const oldest = this.windows.keys().next().value;
        if (oldest === undefined) break;
        this.windows.delete(oldest);
      }
    }
    if (w.count >= this.limit) return false;
    w.count += 1;
    return true;
  }

  /** Gives back one hit (the counted request did not reach WP). */
  refund(key: string): void {
    const w = this.windows.get(key);
    if (w && w.count > 0) w.count -= 1;
  }
}
