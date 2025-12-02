/**
 * Seeded Random Number Generator
 * 
 * Provides deterministic pseudo-random number generation using the Mulberry32 algorithm.
 * This ensures that the same seed always produces the same sequence of random numbers,
 * which is essential for generating consistent demo data across sessions.
 */

export class SeededRandom {
  private state: number;

  /**
   * Creates a new SeededRandom instance
   * @param seed - String seed to initialize the generator (typically a user ID)
   */
  constructor(seed: string) {
    this.state = this.hashString(seed);
  }

  /**
   * Hashes a string to a positive 32-bit integer
   * @param str - String to hash
   * @returns Positive integer seed value
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generates the next random number between 0 (inclusive) and 1 (exclusive)
   * Uses the Mulberry32 algorithm for deterministic generation
   * @returns Random number in range [0, 1)
   */
  next(): number {
    // Mulberry32 algorithm
    this.state = (this.state + 0x6D2B79F5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generates a random integer between min and max (inclusive)
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (inclusive)
   * @returns Random integer in range [min, max]
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Generates a random float between min and max
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (exclusive)
   * @returns Random float in range [min, max)
   */
  nextFloat(min: number, max: number): number {
    // Handle edge case where min equals max
    if (min === max) {
      return min;
    }
    return this.next() * (max - min) + min;
  }

  /**
   * Picks a random element from an array
   * @param array - Array to pick from
   * @returns Random element from the array
   * @throws Error if array is empty
   */
  pick<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    const index = this.nextInt(0, array.length - 1);
    return array[index];
  }

  /**
   * Shuffles an array deterministically using Fisher-Yates algorithm
   * @param array - Array to shuffle (creates a copy, does not modify original)
   * @returns New shuffled array
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
