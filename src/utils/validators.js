import numeral from 'numeral';

import { RESPONSE_TYPES } from '../constants';
import { newError } from './responses';

/**
 * @description higher-order function that returns an object with only the specified fields, or false if not all fields exist in the provided object
 * @param {Array<String>} fields list of required fields
 * @param {Object} obj the object to check
 * @returns {(obj: Object) => Any} function returning object with only specified fields if all provided, false otherwise
 * @throws RESPONSE_TYPES.BAD_REQUEST if missing fields
 */
export const extractObjectFieldsCreator = (fields) => (obj) => {
  // validate document by checking if all fields defined
  const missingFields = fields.filter((field) => obj[field] === undefined);

  if (missingFields.length > 0) {
    throw newError(RESPONSE_TYPES.BAD_REQUEST, `missing fields: ${missingFields}`);
  }

  // only extract good fields
  return fields.reduce((old, key) => ({
    ...old,
    [key]: obj[key],
  }), {});
};

/**
 * @description returns provided value if is a number, else returns fallback
 * @param {number} value numerical value to test
 * @param {any} [fallback=null] value to return if provided value is not a number
 * @returns value
 */
export const validateNumberEntry = (value, fallback = null) => {
  return value === undefined || value === null || value === '' ? fallback : value;
};

/**
 * @description mirrors the mongoose Number cast from unsummarized-trapping.js:
 *  - null/undefined → { ok: true, coerced: null }
 *  - '' → { ok: true, coerced: 0 }
 *  - parseable via numeral → { ok: true, coerced: number }
 *  - otherwise → { ok: false }
 * Used by upload preview to surface CastError-equivalent failures BEFORE bulkWrite.
 */
export const tryCastNumber = (value) => {
  if (value === undefined || value === null) return { ok: true, coerced: null };
  if (value === '') return { ok: true, coerced: 0 };
  if (typeof value === 'number') {
    return Number.isFinite(value) ? { ok: true, coerced: value } : { ok: false };
  }
  const parsed = numeral(value).value();
  if (parsed === null || Number.isNaN(parsed)) return { ok: false };
  return { ok: true, coerced: parsed };
};

/**
 * @description checks Date castability the same way mongoose would.
 * Returns { ok, coerced } where ok=false means mongoose would throw CastError.
 */
export const tryCastDate = (value) => {
  if (value === undefined || value === null || value === '') return { ok: true, coerced: null };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { ok: false };
  return { ok: true, coerced: d };
};
