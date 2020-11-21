import { mergeSpots as mergeCountySpots } from './spot-data-county';
import { mergeSpots as mergeRangerDistrictSpots } from './spot-data-rangerdistrict';

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

const ignore2018DataOptions = {
  year: { $ne: 2018 },
};

export const runPipelineAll = async () => {
  // drop all summarized data and predictions
  const deleteResult = await Promise.all([
    countySummarizeDeleteAll(ignore2018DataOptions),
    rangerDistrictSummarizeDeleteAll(ignore2018DataOptions),
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
    mergeCountySpots('t2'),
    mergeCountySpots('t1'),
    mergeCountySpots('t0'),
    mergeRangerDistrictSpots('t2'),
    mergeRangerDistrictSpots('t1'),
    mergeRangerDistrictSpots('t0'),
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
    mergeCountySpots('t2', year - 2, state),
    mergeCountySpots('t1', year - 1, state),
    mergeCountySpots('t0', year, state),
    mergeRangerDistrictSpots('t2', year - 2, state),
    mergeRangerDistrictSpots('t1', year - 1, state),
    mergeRangerDistrictSpots('t0', year, state),
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
