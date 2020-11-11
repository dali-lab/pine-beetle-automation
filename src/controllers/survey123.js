/* eslint-disable import/prefer-default-export */
import {
  // CountyPredictionModel,
  // RDPredictionModel,
  // SummarizedCountyTrappingModel,
  // SummarizedRangerDistrictTrappingModel,
  // SpotDataModel,
  UnsummarizedTrappingModel,
} from '../models';

import {
  CSV_TO_UNSUMMARIZED,
  STATE_TO_ABBREV_NOSPACE,
  // RESPONSE_TYPES,
} from '../constants';

import {
  cleanCsvCreator,
  cleanBodyCreator,
  getModelAttributes,
  // newError,
  csvUploadSurvey123Creator,
} from '../utils';

const unsummarizedModelAttributes = getModelAttributes(UnsummarizedTrappingModel);

// ensures all attributes present
const cleanBody = cleanBodyCreator(unsummarizedModelAttributes);

// casts either csv or json data to model schema
const cleanCsvOrJson = cleanCsvCreator(CSV_TO_UNSUMMARIZED);

const stateToAbbrevNoSpaceTransform = (document) => {
  return {
    ...document,
    state: STATE_TO_ABBREV_NOSPACE[document.state],
  };
};

/**
 * @description uploads a csv to the unsummarized collection
 * @param {String} filename the csv filename on disk
 * @throws RESPONSE_TYPES.BAD_REQUEST for missing fields
 * @throws other errors depending on what went wrong
 */
export const uploadCsv = csvUploadSurvey123Creator(
  UnsummarizedTrappingModel,
  cleanCsvOrJson,
  cleanBody,
  stateToAbbrevNoSpaceTransform,
);
