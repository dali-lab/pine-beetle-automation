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
  STATE_TO_ABBREV_COMBINED,
  // RESPONSE_TYPES,
} from '../constants';

import {
  // newError,
  cleanBodyCreator,
  cleanCsvCreator,
  csvUploadSurvey123Creator,
  deleteInsert,
  getModelAttributes,
  survey123WebhookUnpackCreator,
} from '../utils';

const unsummarizedModelAttributes = getModelAttributes(UnsummarizedTrappingModel);

// ensures all attributes present
const cleanBody = cleanBodyCreator(unsummarizedModelAttributes);

// casts either csv or json data to model schema
const cleanCsvOrJson = cleanCsvCreator(CSV_TO_UNSUMMARIZED);

const survey123WebhookUnpacker = survey123WebhookUnpackCreator(cleanCsvOrJson, cleanBody);

const stateToAbbrevTransform = (document) => {
  return {
    ...document,
    state: STATE_TO_ABBREV_COMBINED[document.state],
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
  stateToAbbrevTransform,
);

export const uploadSurvey123FromWebhook = async (rawData) => {
  const data = survey123WebhookUnpacker(rawData)
    .map(stateToAbbrevTransform);

  const [deleteOp, ...insertOp] = deleteInsert(data);

  const deleteRes = await UnsummarizedTrappingModel.bulkWrite([deleteOp], { ordered: false });
  const insertRes = await UnsummarizedTrappingModel.bulkWrite(insertOp, { ordered: false });

  return [deleteRes, insertRes];
};
