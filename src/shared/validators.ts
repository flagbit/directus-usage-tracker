/**
 * Input validation functions for Directus Usage Analytics Bundle Extension
 *
 * All validators follow TypeScript strict mode and provide type-safe validation
 * @module validators
 */

import {
  IP_PATTERNS,
  MAX_TOP_N_LIMIT,
  MAX_DATE_RANGE_DAYS,
  MAX_PAGINATION_LIMIT,
} from './constants';
import type { DashboardFilters } from './types';

// ============================================================================
// Date & Time Validation
// ============================================================================

/**
 * Validates that a string is a valid ISO 8601 date.
 *
 * @param value - The string to validate
 * @returns True if valid ISO 8601 date, false otherwise
 */
export function isValidISO8601(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime()) && date.toISOString() === value;
}

/**
 * Validates that start date is before end date.
 *
 * @param start - Start date in ISO 8601 format
 * @param end - End date in ISO 8601 format
 * @returns True if start is before end, false otherwise
 */
export function isValidDateRange(start: string, end: string): boolean {
  if (!isValidISO8601(start) || !isValidISO8601(end)) {
    return false;
  }
  return new Date(start) < new Date(end);
}

/**
 * Validates that date range doesn't exceed maximum allowed days.
 *
 * @param start - Start date in ISO 8601 format
 * @param end - End date in ISO 8601 format
 * @param maxDays - Maximum allowed days (defaults to MAX_DATE_RANGE_DAYS)
 * @returns True if range is within limit, false otherwise
 */
export function isWithinDateRangeLimit(
  start: string,
  end: string,
  maxDays: number = MAX_DATE_RANGE_DAYS
): boolean {
  if (!isValidDateRange(start, end)) {
    return false;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays <= maxDays;
}

// ============================================================================
// IP Address Validation
// ============================================================================

/**
 * Validates IPv4 address format.
 *
 * @param ip - IP address string to validate
 * @returns True if valid IPv4, false otherwise
 */
export function isValidIPv4(ip: string): boolean {
  if (!IP_PATTERNS.IPV4.test(ip)) {
    return false;
  }

  // Check that each octet is 0-255
  const octets = ip.split('.');
  return octets.every((octet) => {
    const num = parseInt(octet, 10);
    return num >= 0 && num <= 255;
  });
}

/**
 * Validates IPv6 address format (simplified validation).
 *
 * @param ip - IP address string to validate
 * @returns True if valid IPv6, false otherwise
 */
export function isValidIPv6(ip: string): boolean {
  return IP_PATTERNS.IPV6.test(ip);
}

/**
 * Validates IP address (IPv4 or IPv6).
 *
 * @param ip - IP address string to validate
 * @returns True if valid IP address, false otherwise
 */
export function isValidIPAddress(ip: string): boolean {
  return isValidIPv4(ip) || isValidIPv6(ip);
}

// ============================================================================
// Numeric Validation
// ============================================================================

/**
 * Validates that a number is within a specified range.
 *
 * @param value - Number to validate
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive)
 * @returns True if within range, false otherwise
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validates "Top N" limit parameter.
 *
 * @param limit - Limit value to validate
 * @returns True if valid limit, false otherwise
 */
export function isValidTopNLimit(limit: number): boolean {
  return Number.isInteger(limit) && isInRange(limit, 1, MAX_TOP_N_LIMIT);
}

/**
 * Validates pagination limit parameter.
 *
 * @param limit - Limit value to validate
 * @returns True if valid pagination limit, false otherwise
 */
export function isValidPaginationLimit(limit: number): boolean {
  return Number.isInteger(limit) && isInRange(limit, 1, MAX_PAGINATION_LIMIT);
}

/**
 * Validates that a value is a positive integer.
 *
 * @param value - Value to validate
 * @returns True if positive integer, false otherwise
 */
export function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

// ============================================================================
// String Validation
// ============================================================================

/**
 * Validates that a string is not empty after trimming.
 *
 * @param value - String to validate
 * @returns True if non-empty, false otherwise
 */
export function isNonEmptyString(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates collection name format.
 * Collection names must be alphanumeric with underscores, start with letter or underscore.
 *
 * @param name - Collection name to validate
 * @returns True if valid collection name, false otherwise
 */
export function isValidCollectionName(name: string): boolean {
  if (!isNonEmptyString(name)) {
    return false;
  }
  // Must start with letter or underscore, followed by alphanumeric or underscores
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

/**
 * Validates action type.
 *
 * @param action - Action type to validate
 * @returns True if valid action type, false otherwise
 */
export function isValidActionType(
  action: string
): action is 'create' | 'update' | 'delete' | 'login' | 'comment' | 'authenticate' {
  const validActions = ['create', 'update', 'delete', 'login', 'comment', 'authenticate'];
  return validActions.includes(action);
}

// ============================================================================
// Dashboard Filters Validation
// ============================================================================

/**
 * Validates complete dashboard filters object.
 *
 * @param filters - Filters object to validate
 * @returns Object with `valid` boolean and optional `errors` array
 */
export function validateDashboardFilters(filters: Partial<DashboardFilters>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate date range
  if (filters.date_range) {
    const { start, end } = filters.date_range;
    if (!isValidISO8601(start)) {
      errors.push('Invalid start date format. Must be ISO 8601.');
    }
    if (!isValidISO8601(end)) {
      errors.push('Invalid end date format. Must be ISO 8601.');
    }
    if (!isValidDateRange(start, end)) {
      errors.push('Start date must be before end date.');
    }
    if (!isWithinDateRangeLimit(start, end)) {
      errors.push(`Date range exceeds maximum of ${MAX_DATE_RANGE_DAYS} days.`);
    }
  }

  // Validate top_n_limit
  if (filters.top_n_limit !== undefined) {
    if (!isValidTopNLimit(filters.top_n_limit)) {
      errors.push(`Top N limit must be between 1 and ${MAX_TOP_N_LIMIT}.`);
    }
  }

  // Validate collections array
  if (filters.collections !== undefined) {
    if (!Array.isArray(filters.collections)) {
      errors.push('Collections must be an array.');
    } else {
      const invalidCollections = filters.collections.filter((c) => !isValidCollectionName(c));
      if (invalidCollections.length > 0) {
        errors.push(`Invalid collection names: ${invalidCollections.join(', ')}`);
      }
    }
  }

  // Validate IP addresses array
  if (filters.ip_addresses !== undefined) {
    if (!Array.isArray(filters.ip_addresses)) {
      errors.push('IP addresses must be an array.');
    } else {
      const invalidIPs = filters.ip_addresses.filter((ip) => !isValidIPAddress(ip));
      if (invalidIPs.length > 0) {
        errors.push(`Invalid IP addresses: ${invalidIPs.join(', ')}`);
      }
    }
  }

  // Validate actions array
  if (filters.actions !== undefined) {
    if (!Array.isArray(filters.actions)) {
      errors.push('Actions must be an array.');
    } else {
      const invalidActions = filters.actions.filter((action) => !isValidActionType(action));
      if (invalidActions.length > 0) {
        errors.push(`Invalid action types: ${invalidActions.join(', ')}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Query Parameter Validation
// ============================================================================

/**
 * Validates sort parameter format.
 *
 * @param sort - Sort parameter (e.g., "row_count", "name", "collection")
 * @returns True if valid sort parameter, false otherwise
 */
export function isValidSortParameter(sort: string): boolean {
  const validSorts = ['row_count', 'name', 'collection'];
  return validSorts.includes(sort);
}

/**
 * Validates sort order parameter.
 *
 * @param order - Sort order ("asc" or "desc")
 * @returns True if valid order, false otherwise
 */
export function isValidSortOrder(order: string): order is 'asc' | 'desc' {
  return order === 'asc' || order === 'desc';
}

/**
 * Validates time-series granularity parameter.
 *
 * @param granularity - Granularity value
 * @returns True if valid granularity, false otherwise
 */
export function isValidGranularity(
  granularity: string
): granularity is 'hour' | 'day' | 'week' | 'month' {
  const validGranularities = ['hour', 'day', 'week', 'month'];
  return validGranularities.includes(granularity);
}

// ============================================================================
// Sanitization Helpers
// ============================================================================

/**
 * Sanitizes a string to prevent SQL injection.
 * Removes or escapes dangerous characters.
 *
 * @param value - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(value: string): string {
  return value
    .trim()
    .replace(/['"`;\\]/g, '') // Remove dangerous SQL characters
    .slice(0, 1000); // Limit length
}

/**
 * Sanitizes an array of strings.
 *
 * @param values - Array of strings to sanitize
 * @returns Array of sanitized strings
 */
export function sanitizeStringArray(values: string[]): string[] {
  return values.filter(isNonEmptyString).map(sanitizeString);
}

/**
 * Clamps a number between min and max values.
 *
 * @param value - Number to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
