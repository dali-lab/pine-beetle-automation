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

import {
  summarizeStateYear as countySummarizeStateYear,
} from './summarized-county-trapping';

import {
  summarizeStateYear as rangerDistrictSummarizeStateYear,
} from './summarized-rangerdistrict-trapping';

import {
  mergeSpots,
} from './spot-data';

import {
  generateStateYearPredictions as countyGenerateStateYearPredictions,
} from './county-prediction';

import {
  generateStateYearPredictions as rangerDistrictGenerateStateYearPredictions,
} from './rd-prediction';

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

/**
 * runs pipeline by summarizing data, appending spot data, and generating predictions
 * @param {String} state state to aggregate and predict on
 * @param {String} year year to aggregate and predict on
 * @returns {Promise<Object>} result data of each bulk operation
 */
export const runPipeline = async (state, rawYear = '0') => {
  const year = parseInt(rawYear, 10);

  // summarize county and ranger district data
  const summarizeResult = await Promise.all([
    countySummarizeStateYear(state, year),
    rangerDistrictSummarizeStateYear(state, year),
  ]);

  // append spot data
  const spotAppendResult = await Promise.all([
    mergeSpots('t2', 'county', year - 2, state),
    mergeSpots('t1', 'county', year - 1, state),
    mergeSpots('t2', 'rangerDistrict', year - 2, state),
    mergeSpots('t1', 'rangerDistrict', year - 1, state),
  ]);

  // generate predictions
  const predictionResult = await Promise.all([
    countyGenerateStateYearPredictions(state, year),
    rangerDistrictGenerateStateYearPredictions(state, year),
  ]);

  return {
    predictionResult,
    spotAppendResult,
    summarizeResult,
  };
};

/**
 * upload survey123 data to unsummarized collection -- should be called by webhook
 * @param {Object} rawData raw data from survey123
 * @returns {Promise<Array>} delete result and insert result data
 */
export const uploadSurvey123FromWebhook = async (rawData) => {
  const isFinalCollection = rawData.Is_Final_Collection === 'yes';

  const data = survey123WebhookUnpacker(rawData)
    .map(stateToAbbrevTransform);

  const [deleteOp, ...insertOp] = deleteInsert(data);

  const deleteRes = await UnsummarizedTrappingModel.bulkWrite([deleteOp], { ordered: false });
  const insertRes = await UnsummarizedTrappingModel.bulkWrite(insertOp, { ordered: false });

  // run pipeline if final collection
  if (isFinalCollection) {
    const { state, year } = data.find((d) => !!d);
    if (state && year) await runPipeline(state, year);
  }

  return [deleteRes, insertRes];
};
