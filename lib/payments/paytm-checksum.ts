import crypto from 'crypto';

const IV = '@@@@&&&&####$$$$';

/**
 * Paytm Checksum utility for secure signature generation & verification.
 * Implements HMAC SHA256 and AES-128-CBC based on Paytm Payment Gateway specs.
 */
export class PaytmChecksum {
  /**
   * Encrypt plain text using Paytm Merchant Key (AES-128-CBC)
   */
  public static encrypt(input: string, key: string): string {
    const cipher = crypto.createCipheriv('AES-128-CBC', Buffer.from(key, 'utf8'), Buffer.from(IV, 'utf8'));
    let encrypted = cipher.update(input, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  }

  /**
   * Decrypt cipher text using Paytm Merchant Key (AES-128-CBC)
   */
  public static decrypt(encrypted: string, key: string): string {
    const decipher = crypto.createDecipheriv('AES-128-CBC', Buffer.from(key, 'utf8'), Buffer.from(IV, 'utf8'));
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Generate 4-character random salt
   */
  public static generateRandomString(length: number = 4): string {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
  }

  /**
   * Generate SHA256 hash with salt
   */
  public static calculateHash(params: string, salt: string): string {
    const finalString = params + '|' + salt;
    return crypto.createHash('sha256').update(finalString).digest('hex') + salt;
  }

  /**
   * Generate Checksum for a string or JSON body
   */
  public static generateSignatureByString(params: string, key: string): string {
    const salt = PaytmChecksum.generateRandomString(4);
    return PaytmChecksum.calculateChecksum(params, key, salt);
  }

  public static calculateChecksum(params: string, key: string, salt: string): string {
    const hash = PaytmChecksum.calculateHash(params, salt);
    return PaytmChecksum.encrypt(hash, key);
  }

  /**
   * Generate Checksum for Paytm Payment Gateway v2 API (JSON or Object)
   */
  public static generateSignature(params: Record<string, unknown> | string, key: string): string {
    if (typeof params !== 'string' && typeof params !== 'object') {
      throw new Error(`Invalid params type for Paytm Checksum: ${typeof params}`);
    }

    let paramsString = '';
    if (typeof params === 'object') {
      paramsString = PaytmChecksum.getStringByParams(params);
    } else {
      paramsString = params;
    }

    return PaytmChecksum.generateSignatureByString(paramsString, key);
  }

  /**
   * Verify Checksum against payload
   */
  public static verifySignature(
    params: Record<string, unknown> | string,
    key: string,
    checksum: string
  ): boolean {
    if (!checksum || !key) return false;

    try {
      let paramsString = '';
      if (typeof params === 'object') {
        paramsString = PaytmChecksum.getStringByParams(params);
      } else {
        paramsString = params;
      }

      const paytmHash = PaytmChecksum.decrypt(checksum, key);
      const salt = paytmHash.slice(paytmHash.length - 4);
      const calculatedHash = PaytmChecksum.calculateHash(paramsString, salt);

      return paytmHash === calculatedHash;
    } catch {
      // Fallback to direct HMAC SHA256 check if AES format differs
      try {
        const expectedHmac = crypto.createHmac('sha256', key).update(typeof params === 'string' ? params : JSON.stringify(params)).digest('hex');
        return expectedHmac === checksum;
      } catch {
        return false;
      }
    }
  }

  /**
   * Convert dictionary/object to sorted pipe-separated string (excluding checksum/signature fields)
   */
  public static getStringByParams(params: Record<string, unknown>): string {
    const data: Record<string, string> = {};
    const excludedKeys = new Set(['checksumhash', 'checksum', 'signature', 'head']);

    Object.keys(params)
      .sort()
      .forEach((key) => {
        if (excludedKeys.has(key.toLowerCase())) {
          return;
        }
        const value = params[key];
        if (value !== null && value !== undefined && value !== '' && String(value).toLowerCase() !== 'null') {
          data[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
        }
      });
    return Object.values(data).join('|');
  }
}
