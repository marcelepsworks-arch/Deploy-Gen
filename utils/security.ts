import CryptoJS from 'crypto-js';

// In a real production environment, this secret should be managed via environment variables 
// or derived from a user session. For this client-side demo, we use a fixed salt 
// mixed with the user agent to prevent simple copy-paste attacks between browsers.
const SECRET_KEY = "WP_DEPLOY_GEN_SECURE_" + navigator.userAgent;

/**
 * Encrypts an object to a Base64 string using AES.
 */
export const encryptData = (data: any): string => {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error("Encryption failed:", error);
    return "";
  }
};

/**
 * Decrypts a Base64 string back to an object.
 */
export const decryptData = (ciphertext: string): any => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(originalText);
  } catch (error) {
    console.error("Decryption failed or invalid key:", error);
    return null;
  }
};
