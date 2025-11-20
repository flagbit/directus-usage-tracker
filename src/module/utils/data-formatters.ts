/**
 * Data formatting utilities for frontend display
 *
 * Provides functions for formatting numbers, dates, and other data for user display
 * @module data-formatters
 */

// ============================================================================
// Number Formatting
// ============================================================================

/**
 * Format a number with thousands separators.
 *
 * @param value - Number to format
 * @param locale - Locale for formatting (defaults to user's locale)
 * @returns Formatted number string
 *
 * @example
 * ```typescript
 * formatNumber(1234567); // "1,234,567" (en-US) or "1.234.567" (de-DE)
 * ```
 */
export function formatNumber(value: number, locale?: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format a number as a compact string (e.g., "1.2K", "3.4M").
 *
 * @param value - Number to format
 * @param locale - Locale for formatting
 * @returns Compact formatted number
 *
 * @example
 * ```typescript
 * formatCompactNumber(1234); // "1.2K"
 * formatCompactNumber(1234567); // "1.2M"
 * formatCompactNumber(1234567890); // "1.2B"
 * ```
 */
export function formatCompactNumber(value: number, locale?: string): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
}

/**
 * Format bytes as human-readable file size.
 *
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string
 *
 * @example
 * ```typescript
 * formatBytes(1024); // "1.00 KB"
 * formatBytes(1048576); // "1.00 MB"
 * formatBytes(1073741824); // "1.00 GB"
 * ```
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format a percentage value.
 *
 * @param value - Percentage value (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 *
 * @example
 * ```typescript
 * formatPercentage(75.5); // "75.5%"
 * formatPercentage(33.333, 2); // "33.33%"
 * ```
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format milliseconds as human-readable duration.
 *
 * @param ms - Milliseconds
 * @returns Formatted duration string
 *
 * @example
 * ```typescript
 * formatDuration(1500); // "1.5s"
 * formatDuration(65000); // "1m 5s"
 * formatDuration(3665000); // "1h 1m 5s"
 * ```
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// ============================================================================
// Date & Time Formatting
// ============================================================================

/**
 * Format an ISO 8601 date string for display.
 *
 * @param isoString - ISO 8601 date string
 * @param locale - Locale for formatting
 * @returns Formatted date string
 *
 * @example
 * ```typescript
 * formatDate('2025-01-20T10:30:00Z'); // "January 20, 2025" (en-US)
 * ```
 */
export function formatDate(isoString: string, locale?: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Format an ISO 8601 date string with time for display.
 *
 * @param isoString - ISO 8601 date string
 * @param locale - Locale for formatting
 * @returns Formatted date and time string
 *
 * @example
 * ```typescript
 * formatDateTime('2025-01-20T10:30:00Z'); // "January 20, 2025, 10:30 AM" (en-US)
 * ```
 */
export function formatDateTime(isoString: string, locale?: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Format an ISO 8601 date string as short date (e.g., "1/20/25").
 *
 * @param isoString - ISO 8601 date string
 * @param locale - Locale for formatting
 * @returns Short formatted date string
 *
 * @example
 * ```typescript
 * formatShortDate('2025-01-20T10:30:00Z'); // "1/20/25" (en-US)
 * ```
 */
export function formatShortDate(isoString: string, locale?: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat(locale, {
    year: '2-digit',
    month: 'numeric',
    day: 'numeric',
  }).format(date);
}

/**
 * Format an ISO 8601 date string as time only.
 *
 * @param isoString - ISO 8601 date string
 * @param locale - Locale for formatting
 * @returns Formatted time string
 *
 * @example
 * ```typescript
 * formatTime('2025-01-20T10:30:00Z'); // "10:30 AM" (en-US)
 * ```
 */
export function formatTime(isoString: string, locale?: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Format a date as relative time (e.g., "2 hours ago").
 *
 * @param isoString - ISO 8601 date string
 * @param locale - Locale for formatting
 * @returns Relative time string
 *
 * @example
 * ```typescript
 * formatRelativeTime('2025-01-20T08:30:00Z'); // "2 hours ago" (if current time is 10:30)
 * ```
 */
export function formatRelativeTime(isoString: string, locale?: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffDays > 0) {
    return rtf.format(-diffDays, 'day');
  } else if (diffHours > 0) {
    return rtf.format(-diffHours, 'hour');
  } else if (diffMinutes > 0) {
    return rtf.format(-diffMinutes, 'minute');
  } else {
    return rtf.format(-diffSeconds, 'second');
  }
}

// ============================================================================
// String Formatting
// ============================================================================

/**
 * Truncate a string to a maximum length with ellipsis.
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length (default: 50)
 * @returns Truncated string
 *
 * @example
 * ```typescript
 * truncateString('This is a very long string', 10); // "This is a..."
 * ```
 */
export function truncateString(str: string, maxLength: number = 50): string {
  if (str.length <= maxLength) {
    return str;
  }
  return `${str.substring(0, maxLength)}...`;
}

/**
 * Convert a snake_case string to Title Case.
 *
 * @param str - Snake case string
 * @returns Title case string
 *
 * @example
 * ```typescript
 * toTitleCase('user_profiles'); // "User Profiles"
 * toTitleCase('directus_users'); // "Directus Users"
 * ```
 */
export function toTitleCase(str: string): string {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format a collection name for display (removes directus_ prefix, title cases).
 *
 * @param collectionName - Raw collection name
 * @returns Formatted collection name
 *
 * @example
 * ```typescript
 * formatCollectionName('directus_users'); // "Users"
 * formatCollectionName('article_categories'); // "Article Categories"
 * ```
 */
export function formatCollectionName(collectionName: string): string {
  const withoutPrefix = collectionName.replace(/^directus_/, '');
  return toTitleCase(withoutPrefix);
}

// ============================================================================
// Array Formatting
// ============================================================================

/**
 * Format an array as a comma-separated list with "and" before the last item.
 *
 * @param items - Array of strings
 * @param limit - Maximum number of items to show (default: no limit)
 * @returns Formatted list string
 *
 * @example
 * ```typescript
 * formatList(['apple', 'banana', 'orange']); // "apple, banana, and orange"
 * formatList(['a', 'b', 'c', 'd'], 2); // "a, b, and 2 more"
 * ```
 */
export function formatList(items: string[], limit?: number): string {
  if (items.length === 0) {
    return '';
  }

  const displayItems = limit ? items.slice(0, limit) : items;
  const remaining = limit && items.length > limit ? items.length - limit : 0;

  if (displayItems.length === 1) {
    return displayItems[0];
  }

  const lastItem = displayItems[displayItems.length - 1];
  const otherItems = displayItems.slice(0, -1);

  let result = otherItems.join(', ');
  result += `, and ${lastItem}`;

  if (remaining > 0) {
    result += `, and ${remaining} more`;
  }

  return result;
}

// ============================================================================
// Color Utilities
// ============================================================================

/**
 * Get a color from the palette by index (wraps around).
 *
 * @param index - Color index
 * @param palette - Color palette array
 * @returns Hex color code
 *
 * @example
 * ```typescript
 * const colors = ['#FF0000', '#00FF00', '#0000FF'];
 * getColorByIndex(0, colors); // "#FF0000"
 * getColorByIndex(3, colors); // "#FF0000" (wraps around)
 * ```
 */
export function getColorByIndex(index: number, palette: readonly string[]): string {
  return palette[index % palette.length];
}

/**
 * Generate an array of colors for a given number of items.
 *
 * @param count - Number of colors needed
 * @param palette - Color palette to use
 * @returns Array of hex color codes
 */
export function generateColors(count: number, palette: readonly string[]): string[] {
  return Array.from({ length: count }, (_, i) => getColorByIndex(i, palette));
}
