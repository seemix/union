/**
 * Bounded in-memory key → value cache with a per-entry TTL and LRU eviction
 * (a `Map` keeps insertion order; a hit re-inserts the key, so the oldest key is the
 * least recently used one).
 *
 * The state lives in one Node process (cPanel/Passenger, Q1) and is lost on restart: fine
 * for the id→slug lookup (one more WP request) and the views limiter (one extra +1).
 */
export class TtlCache<V> {
  private readonly entries = new Map<string, { readonly value: V; readonly expiresAt: number }>();

  constructor(
    private readonly maxSize: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** The value, or `undefined` if absent or expired. A hit marks the key as recently used. */
  get(key: string): V | undefined {
    const entry = this.entries.get(key);
    if (entry === undefined) return undefined;
    this.entries.delete(key);
    if (entry.expiresAt <= this.now()) return undefined;
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key: string, value: V, ttlMs: number): void {
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: this.now() + ttlMs });
    while (this.entries.size > this.maxSize) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
  }

  delete(key: string): void {
    this.entries.delete(key);
  }

  get size(): number {
    return this.entries.size;
  }
}
