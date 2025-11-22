// Property-based tests for encryption utilities
import { describe, it, expect, beforeAll } from 'vitest';
import fc from 'fast-check';
import {
  encrypt,
  decrypt,
  encryptBankAccount,
  decryptBankAccount,
  encryptPAN,
  decryptPAN,
  isEncrypted,
  hashData,
  hashWithSalt,
  verifyHash,
  generateEncryptionKey,
} from './encryption';

// Set up encryption key for tests
beforeAll(() => {
  // Generate a test encryption key if not set
  if (!process.env.ENCRYPTION_KEY) {
    process.env.ENCRYPTION_KEY = generateEncryptionKey();
  }
});

describe('Encryption Property Tests', () => {
  // Feature: cueron-partner-platform, Property 5: Bank detail encryption
  describe('Property 5: Bank detail encryption', () => {
    it('should encrypt bank account numbers so they are not in plaintext', () => {
      fc.assert(
        fc.property(
          // Generate bank account numbers (10-18 digits)
          fc.stringOf(fc.integer({ min: 0, max: 9 }).map(String), {
            minLength: 10,
            maxLength: 18,
          }),
          (accountNumber) => {
            // Skip empty strings
            if (accountNumber.trim().length === 0) return true;

            const encrypted = encryptBankAccount(accountNumber);

            // Property: Encrypted value should not equal plaintext
            expect(encrypted).not.toBe(accountNumber);

            // Property: Encrypted value should be in the correct format (iv:data)
            expect(encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+$/i);

            // Property: Should be able to decrypt back to original
            const decrypted = decryptBankAccount(encrypted);
            expect(decrypted).toBe(accountNumber.trim());

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should encrypt PAN numbers so they are not in plaintext', () => {
      fc.assert(
        fc.property(
          // Generate PAN-like strings (5 letters + 4 digits + 1 letter)
          fc
            .tuple(
              fc.stringOf(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), {
                minLength: 5,
                maxLength: 5,
              }),
              fc.stringOf(fc.integer({ min: 0, max: 9 }).map(String), {
                minLength: 4,
                maxLength: 4,
              }),
              fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
            )
            .map(([letters, digits, lastLetter]) => letters + digits + lastLetter),
          (pan) => {
            const encrypted = encryptPAN(pan);

            // Property: Encrypted value should not equal plaintext
            expect(encrypted).not.toBe(pan);
            expect(encrypted).not.toBe(pan.toUpperCase());

            // Property: Encrypted value should be in the correct format
            expect(encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+$/i);

            // Property: Should be able to decrypt back to original (uppercase)
            const decrypted = decryptPAN(encrypted);
            expect(decrypted).toBe(pan.toUpperCase());

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: cueron-partner-platform, Property 77: Sensitive data encryption
  describe('Property 77: Sensitive data encryption', () => {
    it('should encrypt any sensitive data so it is not in plaintext', () => {
      fc.assert(
        fc.property(
          // Generate various types of sensitive data
          fc.oneof(
            // Bank account numbers
            fc.stringOf(fc.integer({ min: 0, max: 9 }).map(String), {
              minLength: 10,
              maxLength: 18,
            }),
            // PAN numbers
            fc
              .tuple(
                fc.stringOf(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), {
                  minLength: 5,
                  maxLength: 5,
                }),
                fc.stringOf(fc.integer({ min: 0, max: 9 }).map(String), {
                  minLength: 4,
                  maxLength: 4,
                }),
                fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
              )
              .map(([letters, digits, lastLetter]) => letters + digits + lastLetter),
            // IFSC codes
            fc
              .tuple(
                fc.stringOf(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), {
                  minLength: 4,
                  maxLength: 4,
                }),
                fc.constant('0'),
                fc.stringOf(
                  fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),
                  { minLength: 6, maxLength: 6 }
                )
              )
              .map(([bank, zero, branch]) => bank + zero + branch),
            // Generic sensitive strings
            fc.string({ minLength: 1, maxLength: 100 })
          ),
          (sensitiveData) => {
            // Skip empty strings
            if (sensitiveData.trim().length === 0) return true;

            const encrypted = encrypt(sensitiveData);

            // Property: Encrypted value should not be in plaintext
            expect(encrypted).not.toBe(sensitiveData);

            // Property: Encrypted value should have the correct format
            expect(isEncrypted(encrypted)).toBe(true);

            // Property: Should be able to decrypt back to original
            const decrypted = decrypt(encrypted);
            expect(decrypted).toBe(sensitiveData);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce different ciphertexts for the same plaintext (due to random IV)', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 100 }), (plaintext) => {
          const encrypted1 = encrypt(plaintext);
          const encrypted2 = encrypt(plaintext);

          // Property: Same plaintext should produce different ciphertexts
          // (because of random IV)
          expect(encrypted1).not.toBe(encrypted2);

          // Property: Both should decrypt to the same plaintext
          expect(decrypt(encrypted1)).toBe(plaintext);
          expect(decrypt(encrypted2)).toBe(plaintext);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Encryption Round-trip Properties', () => {
    it('should successfully round-trip any string through encryption/decryption', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          (plaintext) => {
            const encrypted = encrypt(plaintext);
            const decrypted = decrypt(encrypted);

            // Property: Round-trip should preserve the original value
            expect(decrypted).toBe(plaintext);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly identify encrypted vs non-encrypted strings', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (plaintext) => {
            // Property: Plaintext should not be identified as encrypted
            expect(isEncrypted(plaintext)).toBe(false);

            // Property: Encrypted text should be identified as encrypted
            const encrypted = encrypt(plaintext);
            expect(isEncrypted(encrypted)).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Hashing Properties', () => {
    it('should produce consistent hashes for the same input', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 100 }), (data) => {
          const hash1 = hashData(data);
          const hash2 = hashData(data);

          // Property: Same input should produce same hash
          expect(hash1).toBe(hash2);

          // Property: Hash should be hex string of fixed length (SHA-256 = 64 chars)
          expect(hash1).toMatch(/^[0-9a-f]{64}$/i);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should produce different hashes for different inputs', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (data1, data2) => {
            // Only test when inputs are different
            if (data1 === data2) return true;

            const hash1 = hashData(data1);
            const hash2 = hashData(data2);

            // Property: Different inputs should produce different hashes
            expect(hash1).not.toBe(hash2);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly verify hashed data with salt', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 100 }), (data) => {
          const { salt, hash } = hashWithSalt(data);

          // Property: Should verify correct data
          expect(verifyHash(data, salt, hash)).toBe(true);

          // Property: Should not verify incorrect data
          expect(verifyHash(data + 'x', salt, hash)).toBe(false);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Error Handling Properties', () => {
    it('should throw error when encrypting empty strings', () => {
      expect(() => encrypt('')).toThrow('Cannot encrypt empty string');
    });

    it('should throw error when decrypting empty strings', () => {
      expect(() => decrypt('')).toThrow('Cannot decrypt empty string');
    });

    it('should throw error when decrypting invalid format', () => {
      fc.assert(
        fc.property(
          // Generate strings that don't match the iv:data format
          fc.string({ minLength: 1, maxLength: 100 }).filter((s) => !s.includes(':')),
          (invalidCiphertext) => {
            expect(() => decrypt(invalidCiphertext)).toThrow();
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should throw error for empty bank account numbers', () => {
      expect(() => encryptBankAccount('')).toThrow(
        'Bank account number cannot be empty'
      );
      expect(() => encryptBankAccount('   ')).toThrow(
        'Bank account number cannot be empty'
      );
    });

    it('should throw error for empty PAN numbers', () => {
      expect(() => encryptPAN('')).toThrow('PAN number cannot be empty');
      expect(() => encryptPAN('   ')).toThrow('PAN number cannot be empty');
    });
  });
});
