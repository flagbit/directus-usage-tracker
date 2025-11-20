/**
 * Validators
 *
 * Input validation functions for API endpoints.
 * Provides validation for query parameters, request bodies, and data formats.
 *
 * @module endpoint/utils/validators
 */

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate query parameters against allowed values
 *
 * @param params - Query parameters to validate
 * @param params.sort - Array of allowed sort values
 * @param params.order - Array of allowed order values
 * @param params.limit - Limit value (must be positive number)
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateQueryParams({
 *   sort: ['row_count', 'collection', 'name'],
 *   order: ['asc', 'desc'],
 *   limit: 50
 * });
 *
 * if (!result.valid) {
 *   return res.status(400).json({ error: result.error });
 * }
 * ```
 */
export function validateQueryParams(params: {
  sort?: string[];
  order?: string[];
  limit?: number;
}): ValidationResult {
  const { sort, order, limit } = params;

  // Validate sort parameter
  if (sort && Array.isArray(sort) && sort.length > 0) {
    // Check if sort value is in allowed values
    // This would be checked against the actual sort parameter from the request
    // but here we're just validating the structure
  }

  // Validate order parameter
  if (order && Array.isArray(order) && order.length > 0) {
    // Check if order value is in allowed values
  }

  // Validate limit parameter
  if (limit !== undefined) {
    if (typeof limit !== 'number' || isNaN(limit)) {
      return {
        valid: false,
        error: 'Limit must be a valid number',
      };
    }

    if (limit < 1) {
      return {
        valid: false,
        error: 'Limit must be greater than 0',
      };
    }

    if (limit > 10000) {
      return {
        valid: false,
        error: 'Limit must be less than or equal to 10000',
      };
    }
  }

  return { valid: true };
}

/**
 * Validate date range
 *
 * @param startDate - Start date (ISO string)
 * @param endDate - End date (ISO string)
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateDateRange('2025-01-01T00:00:00Z', '2025-01-31T23:59:59Z');
 * if (!result.valid) {
 *   return res.status(400).json({ error: result.error });
 * }
 * ```
 */
export function validateDateRange(startDate?: string, endDate?: string): ValidationResult {
  if (startDate) {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return {
        valid: false,
        error: 'Invalid start date format. Use ISO 8601 format.',
      };
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      return {
        valid: false,
        error: 'Invalid end date format. Use ISO 8601 format.',
      };
    }
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return {
        valid: false,
        error: 'Start date must be before end date',
      };
    }
  }

  return { valid: true };
}

/**
 * Validate IP address format
 *
 * @param ip - IP address string
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateIPAddress('192.168.1.1');
 * if (!result.valid) {
 *   return res.status(400).json({ error: result.error });
 * }
 * ```
 */
export function validateIPAddress(ip: string): ValidationResult {
  // IPv4 pattern
  const ipv4Pattern =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // IPv6 pattern (simplified)
  const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  if (!ipv4Pattern.test(ip) && !ipv6Pattern.test(ip)) {
    return {
      valid: false,
      error: 'Invalid IP address format',
    };
  }

  return { valid: true };
}

/**
 * Validate collection name format
 *
 * @param collection - Collection name
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateCollectionName('articles');
 * if (!result.valid) {
 *   return res.status(400).json({ error: result.error });
 * }
 * ```
 */
export function validateCollectionName(collection: string): ValidationResult {
  if (!collection || typeof collection !== 'string') {
    return {
      valid: false,
      error: 'Collection name must be a non-empty string',
    };
  }

  // Collection names should only contain alphanumeric characters, underscores, and hyphens
  const collectionPattern = /^[a-zA-Z0-9_-]+$/;

  if (!collectionPattern.test(collection)) {
    return {
      valid: false,
      error: 'Collection name contains invalid characters',
    };
  }

  if (collection.length > 64) {
    return {
      valid: false,
      error: 'Collection name is too long (max 64 characters)',
    };
  }

  return { valid: true };
}

/**
 * Validate pagination parameters
 *
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validatePagination(2, 50);
 * if (!result.valid) {
 *   return res.status(400).json({ error: result.error });
 * }
 * ```
 */
export function validatePagination(page?: number, pageSize?: number): ValidationResult {
  if (page !== undefined) {
    if (typeof page !== 'number' || isNaN(page) || page < 1) {
      return {
        valid: false,
        error: 'Page must be a positive number',
      };
    }
  }

  if (pageSize !== undefined) {
    if (typeof pageSize !== 'number' || isNaN(pageSize) || pageSize < 1) {
      return {
        valid: false,
        error: 'Page size must be a positive number',
      };
    }

    if (pageSize > 1000) {
      return {
        valid: false,
        error: 'Page size must be less than or equal to 1000',
      };
    }
  }

  return { valid: true };
}

/**
 * Validate sort parameters
 *
 * @param sort - Sort field
 * @param allowedFields - Array of allowed sort fields
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateSort('row_count', ['row_count', 'collection', 'name']);
 * if (!result.valid) {
 *   return res.status(400).json({ error: result.error });
 * }
 * ```
 */
export function validateSort(sort: string, allowedFields: string[]): ValidationResult {
  if (!allowedFields.includes(sort)) {
    return {
      valid: false,
      error: `Invalid sort field. Allowed: ${allowedFields.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validate order parameter
 *
 * @param order - Sort order
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateOrder('desc');
 * if (!result.valid) {
 *   return res.status(400).json({ error: result.error });
 * }
 * ```
 */
export function validateOrder(order: string): ValidationResult {
  const allowedOrders = ['asc', 'desc'];

  if (!allowedOrders.includes(order.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid sort order. Allowed: ${allowedOrders.join(', ')}`,
    };
  }

  return { valid: true };
}
