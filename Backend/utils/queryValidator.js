const ALLOWED_COLLECTIONS = [
  'employees',
  'attendance',
  'clients',
  'deals',
  'invoices',
  'tasks'
];

const ALLOWED_OPERATORS = new Set([
  '$eq',
  '$ne',
  '$gt',
  '$gte',
  '$lt',
  '$lte',
  '$in',
  '$nin',
  '$or',
  '$and',
  '$not',
  '$regex',
  '$options'
]);

/**
 * Validate that a query targeting a collection is secure and uses whitelisted operators only.
 * @param {string} collection Target collection name.
 * @param {object} queryObj Mongo filter query object.
 * @returns {boolean} True if secure, throws error otherwise.
 */
export function validateMongoQuery(collection, queryObj) {
  const normCol = String(collection || '').toLowerCase().trim();

  // 1. Check collection whitelist
  if (!ALLOWED_COLLECTIONS.includes(normCol)) {
    throw new Error(`Collection access denied: "${collection}" is not in the query whitelist.`);
  }

  // 2. Validate query operators recursively
  validateOperators(queryObj);

  return true;
}

function validateOperators(obj) {
  if (!obj || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      validateOperators(item);
    }
    return;
  }

  for (const key of Object.keys(obj)) {
    // Check if key is a query operator
    if (key.startsWith('$')) {
      if (!ALLOWED_OPERATORS.has(key)) {
        throw new Error(`Security Violation: Unsafe MongoDB operator "${key}" detected and blocked.`);
      }
    }
    // Recurse value if object
    validateOperators(obj[key]);
  }
}
