/**
 * Bounded in-memory set of keys with a time-to-live (Map keeps insertion order → LRU-ish eviction).
 *
 * Limitation: the state lives in one Node process. That matches the cPanel/Passenger
 * deploy (Q1: one app process per site). With several processes/instances each one
 * would have its own memory, and a restart forgets everything — acceptable for a view
 * counter: the worst case is an extra +1, never a lost or wrong page.
 */
export class TtlLru {
  private readonly entries = new Map<string, number>();

  constructor(
    private readonly maxSize: number,
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** `true` if `key` is present and not expired. */
  has(key: string): boolean {
    const expiresAt = this.entries.get(key);
    if (expiresAt === undefined) return false;
    if (expiresAt <= this.now()) {
      this.entries.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Atomically checks and marks: `true` if `key` was not present (and is now stored),
   * `false` if it is still within its TTL. Node runs this synchronously, so two parallel
   * requests cannot both get `true`.
   */
  add(key: string): boolean {
    if (this.has(key)) return false;
    this.entries.set(key, this.now() + this.ttlMs);
    while (this.entries.size > this.maxSize) {
      // Oldest insertion first; expired or not, it is the best candidate to drop.
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
    return true;
  }

  delete(key: string): void {
    this.entries.delete(key);
  }

  get size(): number {
    return this.entries.size;
  }
}
