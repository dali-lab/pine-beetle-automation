import RESPONSE_CODES from './response-codes.json';
import RESPONSE_TYPES from './response-types.json';

/**
 * @param {String} responseType type of response to send
 * @param {Object} payload data or error info to send
 * @returns {Object} standardized object to send to client
 */
export const generateResponse = (responseType, payload) => {
  const responseInfo = RESPONSE_CODES[responseType];

  const { status, type } = responseInfo;

  return {
    status,
    type,
    ...(status === RESPONSE_CODES.SUCCESS.status ? { data: payload } : { error: payload }),
  };
};

/**
 * @param {Object} Error to process and send to the client
 * @returns {Object} standardized error to send to client
 */
export const generateErrorResponse = (error) => {
  const [errorType, errorMessage] = error && RESPONSE_CODES[error.type]
    ? [error.type, `Error: ${error.message}`]
    : [RESPONSE_TYPES.INTERNAL_ERROR, error ?? 'undefined error'];

  const { status, type } = RESPONSE_CODES[errorType];

  return {
    error: errorMessage,
    status,
    type,
  };
};

/**
 * @param {String} type error type
 * @param {String} message error message
 * @returns {Object} standardized error format
 */
export const newError = (type, message) => ({
  message,
  type,
});

/**
 * higher-order function to construct each controller's body-cleaner through dependency injection
 * @param {Array<String>} paramsToExtract list of parameters needed in the model
 * @param {Object} reqbody the proposed document to clean up/check from req.body
 * @returns {(reqbody: Object) => Any} function returning cleaned document if successful, false otherwise
 */
export const cleanBodyCreator = (paramsToExtract) => (reqbody) => (
  paramsToExtract.reduce((cleanedBody, key) => (
    cleanedBody && reqbody[key] !== undefined && { ...cleanedBody, [key]: reqbody[key] }
  ), {})
);

export {
  RESPONSE_CODES,
  RESPONSE_TYPES,
};
