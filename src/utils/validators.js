/**
 * @description higher-order function that returns an object with only the specified fields, or false if not all fields exist in the provided object
 * @param {Array<String>} fields list of required fields
 * @param {Object} obj the object to check
 * @returns {(obj: Object) => Any} function returning object with only specified fields if all provided, false otherwise
 */
export const extractObjectFieldsCreator = (fields) => (obj) => (
  fields.reduce((cleanedBody, key) => (
    cleanedBody && obj[key] !== undefined && { ...cleanedBody, [key]: obj[key] }
  ), {})
);

/**
 * @description returns provided value if is a number, else returns fallback
 * @param {number} value numerical value to test
 * @param {any} [fallback=null] value to return if provided value is not a number
 * @returns value
 */
export const validateNumberEntry = (value, fallback = null) => {
  return value === undefined || value === null || value === '' ? fallback : value;
};
