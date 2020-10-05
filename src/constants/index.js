import RESPONSE_CODES from './response-codes.json';
import RESPONSE_TYPES from './response-types.json';
import CSV_TO_UNSUMMARIZED from './csv-to-unsummarized.json';

import {
  cleanCsvCreator,
  csvUploadCreator,
  deleteFile,
} from './csv-upload';

import {
  generateResponse,
  generateErrorResponse,
  newError,
} from './responses';

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
  cleanCsvCreator,
  csvUploadCreator,
  CSV_TO_UNSUMMARIZED,
  deleteFile,
  generateErrorResponse,
  generateResponse,
  newError,
  RESPONSE_CODES,
  RESPONSE_TYPES,
};
