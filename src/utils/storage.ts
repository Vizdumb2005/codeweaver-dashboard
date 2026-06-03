// Local Storage Utilities

/**
 * Get a value from localStorage
 */
export function getStorage<T>(key: string, defaultValue?: T): T | undefined {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Set a value in localStorage
 */
export function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

/**
 * Remove a value from localStorage
 */
export function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
}

/**
 * Clear all values from localStorage
 */
export function clearStorage(): void {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}

/**
 * Get a value from sessionStorage
 */
export function getSessionStorage<T>(key: string, defaultValue?: T): T | undefined {
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Set a value in sessionStorage
 */
export function setSessionStorage<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to sessionStorage:', error);
  }
}

/**
 * Storage wrapper with prefix support
 */
export class PrefixedStorage {
  private readonly prefix: string;

  constructor(prefix: string) {
    this.prefix = `${prefix}_`;
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    return getStorage<T>(this.prefix + key, defaultValue);
  }

  set<T>(key: string, value: T): void {
    setStorage<T>(this.prefix + key, value);
  }

  remove(key: string): void {
    removeStorage(this.prefix + key);
  }

  clear(): void {
    // Note: This only clears items with our prefix
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => removeStorage(key));
  }
}
