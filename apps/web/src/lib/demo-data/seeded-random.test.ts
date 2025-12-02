/**
 * Property-Based Tests for SeededRandom
 * 
 * These tests verify that the seeded random number generator behaves correctly
 * across a wide range of inputs, ensuring deterministic and consistent behavior.
 */

import * as fc from 'fast-check';
import { SeededRandom } from './seeded-random';

describe('SeededRandom', () => {
  describe('Property Tests', () => {
    // **Feature: dashboard-demo-data, Property 6: Deterministic generation**
    // **Validates: Requirements 5.1**
    it('should generate identical sequences for the same seed', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (seed) => {
          const rng1 = new SeededRandom(seed);
          const rng2 = new SeededRandom(seed);

          // Generate multiple values and verify they match
          const sequence1 = Array.from({ length: 100 }, () => rng1.next());
          const sequence2 = Array.from({ length: 100 }, () => rng2.next());

          // All values should be identical
          for (let i = 0; i < sequence1.length; i++) {
            if (sequence1[i] !== sequence2[i]) {
              return false;
            }
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should generate values in range [0, 1) for next()', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (seed) => {
          const rng = new SeededRandom(seed);
          
          // Generate multiple values and check range
          for (let i = 0; i < 50; i++) {
            const value = rng.next();
            if (value < 0 || value >= 1) {
              return false;
            }
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should generate integers in specified range for nextInt()', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.integer({ min: -100, max: 100 }),
          fc.integer({ min: -100, max: 100 }),
          (seed, a, b) => {
            const min = Math.min(a, b);
            const max = Math.max(a, b);
            const rng = new SeededRandom(seed);

            // Generate multiple values and check range
            for (let i = 0; i < 50; i++) {
              const value = rng.nextInt(min, max);
              if (value < min || value > max || !Number.isInteger(value)) {
                return false;
              }
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate floats in specified range for nextFloat()', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.float({ min: -1000, max: 1000, noNaN: true }),
          fc.float({ min: -1000, max: 1000, noNaN: true }),
          (seed, a, b) => {
            const min = Math.min(a, b);
            const max = Math.max(a, b);
            const rng = new SeededRandom(seed);

            // Generate multiple values and check range
            for (let i = 0; i < 50; i++) {
              const value = rng.nextFloat(min, max);
              if (value < min || value >= max) {
                return false;
              }
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should pick elements from array deterministically', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.array(fc.integer(), { minLength: 1, maxLength: 100 }),
          (seed, array) => {
            const rng1 = new SeededRandom(seed);
            const rng2 = new SeededRandom(seed);

            // Pick multiple elements and verify they match
            const picks1 = Array.from({ length: 20 }, () => rng1.pick(array));
            const picks2 = Array.from({ length: 20 }, () => rng2.pick(array));

            // All picks should be identical
            for (let i = 0; i < picks1.length; i++) {
              if (picks1[i] !== picks2[i]) {
                return false;
              }
            }

            // All picks should be from the array
            return picks1.every(pick => array.includes(pick));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should shuffle arrays deterministically', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.array(fc.integer(), { minLength: 1, maxLength: 50 }),
          (seed, array) => {
            const rng1 = new SeededRandom(seed);
            const rng2 = new SeededRandom(seed);

            const shuffled1 = rng1.shuffle(array);
            const shuffled2 = rng2.shuffle(array);

            // Shuffled arrays should be identical
            if (shuffled1.length !== shuffled2.length) {
              return false;
            }

            for (let i = 0; i < shuffled1.length; i++) {
              if (shuffled1[i] !== shuffled2[i]) {
                return false;
              }
            }

            // Shuffled array should contain same elements as original
            const sorted1 = [...shuffled1].sort((a, b) => a - b);
            const sorted2 = [...array].sort((a, b) => a - b);

            if (sorted1.length !== sorted2.length) {
              return false;
            }

            for (let i = 0; i < sorted1.length; i++) {
              if (sorted1[i] !== sorted2[i]) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not modify original array when shuffling', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.array(fc.integer(), { minLength: 1, maxLength: 50 }),
          (seed, array) => {
            const original = [...array];
            const rng = new SeededRandom(seed);
            
            rng.shuffle(array);

            // Original array should be unchanged
            if (array.length !== original.length) {
              return false;
            }

            for (let i = 0; i < array.length; i++) {
              if (array[i] !== original[i]) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate different sequences for different seeds', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          (seed1, seed2) => {
            // Skip if seeds are the same
            if (seed1 === seed2) {
              return true;
            }

            const rng1 = new SeededRandom(seed1);
            const rng2 = new SeededRandom(seed2);

            // Generate sequences
            const sequence1 = Array.from({ length: 100 }, () => rng1.next());
            const sequence2 = Array.from({ length: 100 }, () => rng2.next());

            // At least some values should be different
            let differences = 0;
            for (let i = 0; i < sequence1.length; i++) {
              if (sequence1[i] !== sequence2[i]) {
                differences++;
              }
            }

            // We expect most values to be different for different seeds
            return differences > 50;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    it('should throw error when picking from empty array', () => {
      const rng = new SeededRandom('test-seed');
      expect(() => rng.pick([])).toThrow('Cannot pick from empty array');
    });

    it('should handle single-element arrays', () => {
      const rng = new SeededRandom('test-seed');
      const array = [42];
      expect(rng.pick(array)).toBe(42);
      expect(rng.shuffle(array)).toEqual([42]);
    });

    it('should handle empty string seed', () => {
      const rng = new SeededRandom('');
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });

    it('should handle special characters in seed', () => {
      const rng = new SeededRandom('!@#$%^&*()_+-=[]{}|;:,.<>?');
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });

    it('should handle unicode characters in seed', () => {
      const rng = new SeededRandom('你好世界🌍');
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });
  });
});
