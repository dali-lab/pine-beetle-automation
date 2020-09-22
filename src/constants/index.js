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

export {
  RESPONSE_CODES,
  RESPONSE_TYPES,
};
