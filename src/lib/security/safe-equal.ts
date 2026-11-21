import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Constant-time string comparison for shared secrets.
 * Both sides are hashed first: `timingSafeEqual` needs equal lengths, and comparing
 * digests keeps the length of the expected secret from leaking through timing.
 * An empty expected secret never matches (= feature disabled).
 */
export function safeEqual(
  provided: string | null | undefined,
  expected: string | undefined,
): boolean {
  if (!expected || !provided) return false;
  const a = createHash('sha256').update(provided, 'utf8').digest();
  const b = createHash('sha256').update(expected, 'utf8').digest();
  return timingSafeEqual(a, b);
}
