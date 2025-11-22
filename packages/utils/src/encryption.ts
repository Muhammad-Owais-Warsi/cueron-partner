// Encryption and security utilities
import crypto from 'crypto';

/**
 * Encryption configuration
 */
const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits

/**
 * Get encryption key from environment variable
 * In production, this should be stored securely (e.g., AWS Secrets Manager, environment variables)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  
  // Ensure key is exactly 32 bytes
  const keyBuffer = Buffer.from(key, 'hex');
  
  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(`Encryption key must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex characters)`);
  }
  
  return keyBuffer;
}

/**
 * Generate a secure encryption key (for initial setup)
 * This should be run once and the key stored securely
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Encrypt sensitive data using AES-256-CBC
 * @param plaintext - The data to encrypt
 * @returns Encrypted data in format: iv:encryptedData (both hex encoded)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty string');
  }
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return IV and encrypted data separated by colon
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt data encrypted with encrypt()
 * @param ciphertext - The encrypted data in format: iv:encryptedData
 * @returns Decrypted plaintext
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) {
    throw new Error('Cannot decrypt empty string');
  }
  
  const parts = ciphertext.split(':');
  
  if (parts.length !== 2) {
    throw new Error('Invalid ciphertext format');
  }
  
  const key = getEncryptionKey();
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedData = parts[1];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Hash sensitive data using SHA-256
 * Useful for one-way hashing (e.g., for comparison without storing plaintext)
 * @param data - The data to hash
 * @returns Hex-encoded hash
 */
export function hashData(data: string): string {
  if (!data) {
    throw new Error('Cannot hash empty string');
  }
  
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Hash data with a salt using PBKDF2
 * More secure for password-like data
 * @param data - The data to hash
 * @param salt - Optional salt (will be generated if not provided)
 * @returns Object with salt and hash
 */
export function hashWithSalt(
  data: string,
  salt?: string
): { salt: string; hash: string } {
  if (!data) {
    throw new Error('Cannot hash empty string');
  }
  
  const saltBuffer = salt
    ? Buffer.from(salt, 'hex')
    : crypto.randomBytes(16);
  
  const hash = crypto.pbkdf2Sync(data, saltBuffer, 100000, 64, 'sha512');
  
  return {
    salt: saltBuffer.toString('hex'),
    hash: hash.toString('hex'),
  };
}

/**
 * Verify hashed data
 * @param data - The plaintext data to verify
 * @param salt - The salt used for hashing
 * @param hash - The hash to compare against
 * @returns True if data matches hash
 */
export function verifyHash(data: string, salt: string, hash: string): boolean {
  const result = hashWithSalt(data, salt);
  return result.hash === hash;
}

/**
 * Encrypt bank account details
 * @param accountNumber - Bank account number
 * @returns Encrypted account number
 */
export function encryptBankAccount(accountNumber: string): string {
  if (!accountNumber || accountNumber.trim().length === 0) {
    throw new Error('Bank account number cannot be empty');
  }
  
  return encrypt(accountNumber.trim());
}

/**
 * Decrypt bank account details
 * @param encryptedAccountNumber - Encrypted bank account number
 * @returns Decrypted account number
 */
export function decryptBankAccount(encryptedAccountNumber: string): string {
  return decrypt(encryptedAccountNumber);
}

/**
 * Encrypt PAN number
 * @param pan - PAN number
 * @returns Encrypted PAN
 */
export function encryptPAN(pan: string): string {
  if (!pan || pan.trim().length === 0) {
    throw new Error('PAN number cannot be empty');
  }
  
  return encrypt(pan.trim().toUpperCase());
}

/**
 * Decrypt PAN number
 * @param encryptedPAN - Encrypted PAN number
 * @returns Decrypted PAN
 */
export function decryptPAN(encryptedPAN: string): string {
  return decrypt(encryptedPAN);
}

/**
 * Check if a string appears to be encrypted (has the iv:data format)
 * @param value - The value to check
 * @returns True if the value appears to be encrypted
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  
  const parts = value.split(':');
  if (parts.length !== 2) return false;
  
  // Check if both parts are valid hex strings
  const hexRegex = /^[0-9a-f]+$/i;
  return hexRegex.test(parts[0]) && hexRegex.test(parts[1]);
}
