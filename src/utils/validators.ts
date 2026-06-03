// Validation Utilities

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Check if a value is a valid email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if a value is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a value is a valid phone number (basic check)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Check if a value is a valid UUID
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Check if a value is within a range
 */
export function isInRange(
  value: number,
  min: number,
  max: number,
  inclusive: boolean = true,
): boolean {
  if (inclusive) {
    return value >= min && value <= max;
  }
  return value > min && value < max;
}

/**
 * Check if a string has a minimum length
 */
export function hasMinLength(value: string, min: number): boolean {
  return value.length >= min;
}

/**
 * Check if a string has a maximum length
 */
export function hasMaxLength(value: string, max: number): boolean {
  return value.length <= max;
}

/**
 * Check if a string contains only alphabetic characters
 */
export function isAlphabetic(value: string): boolean {
  return /^[a-zA-Z]+$/.test(value);
}

/**
 * Check if a string contains only numeric characters
 */
export function isNumeric(value: string): boolean {
  return /^\d+$/.test(value);
}

/**
 * Check if a string is alphanumeric
 */
export function isAlphanumeric(value: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(value);
}

/**
 * Result type for validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate multiple fields at once
 */
export function validateFields(
  fields: Record<
    string,
    { value: unknown; validator: (value: unknown) => boolean; message: string }
  >,
): ValidationResult {
  const errors: string[] = [];

  for (const [fieldName, { value, validator, message }] of Object.entries(fields)) {
    if (!validator(value)) {
      errors.push(`${fieldName}: ${message}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
