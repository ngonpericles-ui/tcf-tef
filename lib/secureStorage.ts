/**
 * Secure Token Storage Utility
 * Provides encrypted storage for sensitive data like JWT tokens
 */

interface SecureStorageOptions {
  encryptionKey?: string
  storageType?: 'localStorage' | 'sessionStorage' | 'memory'
  ttl?: number // Time to live in milliseconds
}

export class SecureStorage {
  private static readonly DEFAULT_KEY = 'tcf_tef_secure_key'
  private static readonly STORAGE_PREFIX = 'tcf_secure_'
  private static readonly ENCRYPTION_ALGORITHM = 'AES-GCM'
  
  private static async getEncryptionKey(): Promise<string> {
    if (typeof window === 'undefined') return this.DEFAULT_KEY
    
    // Try to get from sessionStorage first (more secure)
    let key = sessionStorage.getItem('tcf_encryption_key')
    
    if (!key) {
      // Generate a new key based on browser fingerprint
      key = await this.generateBrowserFingerprint()
      sessionStorage.setItem('tcf_encryption_key', key)
    }
    
    return key
  }
  
  private static async generateBrowserFingerprint(): Promise<string> {
    if (typeof window === 'undefined') return this.DEFAULT_KEY
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillText('Browser fingerprint', 2, 2)
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|')
    
    // Generate a 32-byte key using Web Crypto API
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(fingerprint)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = new Uint8Array(hashBuffer)
      return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('')
    } catch (error) {
      // Fallback to simple hash if Web Crypto is not available
      let hash = 0
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32-bit integer
      }
      
      // Ensure we have a 64-character hex string (32 bytes)
      const hexString = Math.abs(hash).toString(16).padStart(8, '0')
      return (hexString + hexString + hexString + hexString + hexString + hexString + hexString + hexString).slice(0, 64)
    }
  }
  
  private static async encrypt(data: string, key?: string): Promise<string> {
    if (typeof window === 'undefined') return data
    
    try {
      // Use Web Crypto API for encryption
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(data)
      const encryptionKey = key || await this.getEncryptionKey()
      
      // Ensure key is exactly 32 bytes for AES-GCM
      const keyBytes = new TextEncoder().encode(encryptionKey)
      const keyBuffer = new Uint8Array(32)
      if (keyBytes.length >= 32) {
        keyBuffer.set(keyBytes.slice(0, 32))
      } else {
        // Pad with zeros if key is too short
        keyBuffer.set(keyBytes)
        for (let i = keyBytes.length; i < 32; i++) {
          keyBuffer[i] = 0
        }
      }
      
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: this.ENCRYPTION_ALGORITHM },
        false,
        ['encrypt']
      )
      
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const encrypted = await crypto.subtle.encrypt(
        { name: this.ENCRYPTION_ALGORITHM, iv },
        cryptoKey,
        dataBuffer
      )
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength)
      combined.set(iv)
      combined.set(new Uint8Array(encrypted), iv.length)
      
      // Convert to base64
      return btoa(String.fromCharCode(...combined))
    } catch (error) {
      console.error('Encryption failed:', error)
      // Fallback to simple encoding
      return btoa(data)
    }
  }
  
  private static async decrypt(encryptedData: string, key?: string): Promise<string> {
    if (typeof window === 'undefined') return encryptedData
    
    try {
      // Decode from base64
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, 12)
      const encrypted = combined.slice(12)
      
      const encoder = new TextEncoder()
      const decryptionKey = key || await this.getEncryptionKey()
      
      // Ensure key is exactly 32 bytes for AES-GCM
      const keyBytes = encoder.encode(decryptionKey)
      const keyBuffer = new Uint8Array(32)
      if (keyBytes.length >= 32) {
        keyBuffer.set(keyBytes.slice(0, 32))
      } else {
        // Pad with zeros if key is too short
        keyBuffer.set(keyBytes)
        for (let i = keyBytes.length; i < 32; i++) {
          keyBuffer[i] = 0
        }
      }
      
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: this.ENCRYPTION_ALGORITHM },
        false,
        ['decrypt']
      )
      
      const decrypted = await crypto.subtle.decrypt(
        { name: this.ENCRYPTION_ALGORITHM, iv },
        cryptoKey,
        encrypted
      )
      
      const decoder = new TextDecoder()
      return decoder.decode(decrypted)
    } catch (error) {
      console.error('Decryption failed:', error)
      // Fallback to simple decoding
      try {
        return atob(encryptedData)
      } catch {
        return encryptedData
      }
    }
  }
  
  private static getStorageKey(key: string): string {
    return `${this.STORAGE_PREFIX}${key}`
  }
  
  private static getStorage(): Storage | null {
    if (typeof window === 'undefined') return null
    
    try {
      return localStorage
    } catch (error) {
      console.error('Storage not available:', error)
      return null
    }
  }
  
  /**
   * Store encrypted data
   */
  static async setItem(key: string, value: any, options: SecureStorageOptions = {}): Promise<boolean> {
    try {
      const storage = this.getStorage()
      if (!storage) return false
      
      const encryptionKey = options.encryptionKey || await this.getEncryptionKey()
      const data = JSON.stringify({
        value,
        timestamp: Date.now(),
        ttl: options.ttl
      })
      
      const encrypted = await this.encrypt(data, encryptionKey)
      const storageKey = this.getStorageKey(key)
      
      storage.setItem(storageKey, encrypted)
      return true
    } catch (error) {
      console.error('Failed to store encrypted data:', error)
      return false
    }
  }
  
  /**
   * Retrieve and decrypt data
   */
  static async getItem<T = any>(key: string, options: SecureStorageOptions = {}): Promise<T | null> {
    try {
      const storage = this.getStorage()
      if (!storage) return null
      
      const encryptionKey = options.encryptionKey || await this.getEncryptionKey()
      const storageKey = this.getStorageKey(key)
      const encrypted = storage.getItem(storageKey)
      
      if (!encrypted) return null
      
      const decrypted = await this.decrypt(encrypted, encryptionKey)
      const data = JSON.parse(decrypted)
      
      // Check TTL
      if (data.ttl && Date.now() - data.timestamp > data.ttl) {
        this.removeItem(key)
        return null
      }
      
      return data.value
    } catch (error) {
      console.error('Failed to retrieve encrypted data:', error)
      return null
    }
  }
  
  /**
   * Remove stored data
   */
  static removeItem(key: string): boolean {
    try {
      const storage = this.getStorage()
      if (!storage) return false
      
      const storageKey = this.getStorageKey(key)
      storage.removeItem(storageKey)
      return true
    } catch (error) {
      console.error('Failed to remove encrypted data:', error)
      return false
    }
  }
  
  /**
   * Clear all encrypted data
   */
  static clear(): boolean {
    try {
      const storage = this.getStorage()
      if (!storage) return false
      
      const keysToRemove: string[] = []
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => storage.removeItem(key))
      return true
    } catch (error) {
      console.error('Failed to clear encrypted data:', error)
      return false
    }
  }
  
  /**
   * Check if data exists
   */
  static hasItem(key: string): boolean {
    try {
      const storage = this.getStorage()
      if (!storage) return false
      
      const storageKey = this.getStorageKey(key)
      return storage.getItem(storageKey) !== null
    } catch (error) {
      console.error('Failed to check encrypted data:', error)
      return false
    }
  }
  
  /**
   * Get all stored keys
   */
  static getKeys(): string[] {
    try {
      const storage = this.getStorage()
      if (!storage) return []
      
      const keys: string[] = []
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          keys.push(key.replace(this.STORAGE_PREFIX, ''))
        }
      }
      
      return keys
    } catch (error) {
      console.error('Failed to get encrypted data keys:', error)
      return []
    }
  }
}

/**
 * Token-specific secure storage
 */
export class SecureTokenStorage {
  private static readonly ACCESS_TOKEN_KEY = 'access_token'
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token'
  private static readonly TOKEN_TTL = 15 * 60 * 1000 // 15 minutes
  
  /**
   * Store access token securely
   */
  static async storeAccessToken(token: string): Promise<boolean> {
    return SecureStorage.setItem(this.ACCESS_TOKEN_KEY, token, {
      ttl: this.TOKEN_TTL
    })
  }
  
  /**
   * Store refresh token securely
   */
  static async storeRefreshToken(token: string): Promise<boolean> {
    return SecureStorage.setItem(this.REFRESH_TOKEN_KEY, token, {
      ttl: 30 * 24 * 60 * 60 * 1000 // 30 days
    })
  }
  
  /**
   * Get access token
   */
  static async getAccessToken(): Promise<string | null> {
    return SecureStorage.getItem<string>(this.ACCESS_TOKEN_KEY)
  }
  
  /**
   * Get refresh token
   */
  static async getRefreshToken(): Promise<string | null> {
    return SecureStorage.getItem<string>(this.REFRESH_TOKEN_KEY)
  }
  
  /**
   * Clear all tokens
   */
  static async clearTokens(): Promise<boolean> {
    const accessRemoved = SecureStorage.removeItem(this.ACCESS_TOKEN_KEY)
    const refreshRemoved = SecureStorage.removeItem(this.REFRESH_TOKEN_KEY)
    return accessRemoved && refreshRemoved
  }
  
  /**
   * Check if tokens exist
   */
  static async hasTokens(): Promise<boolean> {
    const hasAccess = SecureStorage.hasItem(this.ACCESS_TOKEN_KEY)
    const hasRefresh = SecureStorage.hasItem(this.REFRESH_TOKEN_KEY)
    return hasAccess && hasRefresh
  }
  
  /**
   * Validate token format
   */
  static isValidToken(token: string): boolean {
    if (!token || typeof token !== 'string') return false
    
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.')
    if (parts.length !== 3) return false
    
    // Each part should be base64 encoded
    try {
      parts.forEach(part => atob(part))
      return true
    } catch {
      return false
    }
  }
}
