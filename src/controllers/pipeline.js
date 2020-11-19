import { mergeSpots } from './spot-data';

import {
  deleteAll as countySummarizeDeleteAll,
  deleteStateYear as countySummarizeDeleteStateYear,
  summarizeAll as countySummarizeAll,
  summarizeStateYear as countySummarizeStateYear,
} from './summarized-county-trapping';

import {
  deleteAll as rangerDistrictSummarizeDeleteAll,
  deleteStateYear as rangerDistrictSummarizeDeleteStateYear,
  summarizeAll as rangerDistrictSummarizeAll,
  summarizeStateYear as rangerDistrictSummarizeStateYear,
} from './summarized-rangerdistrict-trapping';

import {
  deleteAll as countyPredictionDeleteAll,
  deleteStateYear as countyPredictionDeleteStateYear,
  generateStateYearPredictions as countyGenerateStateYearPredictions,
  generateAllPredictions as countyGenerateAllPredictions,
} from './county-prediction';

import {
  deleteAll as rangerDistrictPredictionDeleteAll,
  deleteStateYear as rangerDistrictPredictionDeleteStateYear,
  generateStateYearPredictions as rangerDistrictGenerateStateYearPredictions,
  generateAllPredictions as rangerDistrictGenerateAllPredictions,
} from './rd-prediction';

export const runPipelineAll = async () => {
  // drop all summarized data and predictions
  const deleteResult = await Promise.all([
    countySummarizeDeleteAll(),
    rangerDistrictSummarizeDeleteAll(),
    countyPredictionDeleteAll(),
    rangerDistrictPredictionDeleteAll(),
  ]);

  // summarize county and ranger district data
  const summarizeResult = await Promise.all([
    countySummarizeAll(),
    rangerDistrictSummarizeAll(),
  ]);

  // append spot data
  const spotAppendResult = await Promise.all([
    mergeSpots('t2', 'county'),
    mergeSpots('t1', 'county'),
    mergeSpots('t0', 'county'),
    mergeSpots('t2', 'rangerDistrict'),
    mergeSpots('t1', 'rangerDistrict'),
    mergeSpots('t0', 'rangerDistrict'),
  ]);

  // generate predictions
  const predictionResult = await Promise.all([
    countyGenerateAllPredictions(),
    rangerDistrictGenerateAllPredictions(),
  ]);

  return {
    deleteResult,
    predictionResult,
    spotAppendResult,
    summarizeResult,
  };
};

/**
 * runs pipeline by summarizing data, appending spot data, and generating predictions
 * @param {String} state state to aggregate and predict on
 * @param {String} year year to aggregate and predict on
 * @returns {Promise<Object>} result data of each bulk operation
 */
export const runPipelineStateYear = async (state, rawYear = '0') => {
  const year = parseInt(rawYear, 10);

  // drop all summarized data and predictions
  const deleteResult = await Promise.all([
    countySummarizeDeleteStateYear(state, year),
    rangerDistrictSummarizeDeleteStateYear(state, year),
    countyPredictionDeleteStateYear(state, year),
    rangerDistrictPredictionDeleteStateYear(state, year),
  ]);

  // summarize county and ranger district data
  const summarizeResult = await Promise.all([
    countySummarizeStateYear(state, year),
    rangerDistrictSummarizeStateYear(state, year),
  ]);

  // append spot data
  const spotAppendResult = await Promise.all([
    mergeSpots('t2', 'county', year - 2, state),
    mergeSpots('t1', 'county', year - 1, state),
    mergeSpots('t0', 'county', year, state),
    mergeSpots('t2', 'rangerDistrict', year - 2, state),
    mergeSpots('t1', 'rangerDistrict', year - 1, state),
    mergeSpots('t0', 'rangerDistrict', year, state),
  ]);

  // generate predictions
  const predictionResult = await Promise.all([
    countyGenerateStateYearPredictions(state, year),
    rangerDistrictGenerateStateYearPredictions(state, year),
  ]);

  return {
    deleteResult,
    predictionResult,
    spotAppendResult,
    summarizeResult,
  };
};
