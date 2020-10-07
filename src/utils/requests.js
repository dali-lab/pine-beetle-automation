/* eslint-disable import/prefer-default-export */

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
