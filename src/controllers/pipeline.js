/* eslint-disable import/prefer-default-export */
import {
  summarizeAll as countySummarizeAll,
  yearT1Pass as countyYearT1Pass,
  yearT2Pass as countyYearT2Pass,
  indicatorPass as countyIndicatorPass,
  generateAllPredictions as countyGenerateAllPredictions,
} from './summarized-county';

import {
  summarizeAll as rangerDistrictSummarizeAll,
  yearT1Pass as rangerDistrictYearT1Pass,
  yearT2Pass as rangerDistrictYearT2Pass,
  indicatorPass as rangerDistrictIndicatorPass,
  generateAllPredictions as rangerDistrictGenerateAllPredictions,
} from './summarized-rangerdistrict';

// start year that we should modify data (allows us to leave all 2020 and prior data alone)
const DEFAULT_CUTOFF_YEAR = 2021;

/**
 * @description runs the entire pipeline (summarize data, generate predictions)
 * @param {Number} [cutoffYear=2021] start year that data should be modified for
 * @returns {Promise<Object>} result of each operation
 */
export const runPipelineAll = async (cutoffYear = DEFAULT_CUTOFF_YEAR) => {
  console.log('RUNNING PIPELINE');

  const yearT0Filter = { year: { $gte: cutoffYear } };
  const yearT1Filter = { year: { $gte: cutoffYear - 1 } };
  const yearT2Filter = { year: { $gte: cutoffYear - 2 } };

  try {
    // summarize county and ranger district data
    const summarizeResult = await Promise.all([
      countySummarizeAll(yearT0Filter),
      rangerDistrictSummarizeAll(yearT0Filter),
    ]);

    // generate spotst2
    const yearT2PassResult = await Promise.all([
      countyYearT2Pass(yearT2Filter),
      rangerDistrictYearT2Pass(yearT2Filter),
    ]);

    // generate spotst1 & cleridst1
    const yearT1PassResult = await Promise.all([
      countyYearT1Pass(yearT1Filter),
      rangerDistrictYearT1Pass(yearT1Filter),
    ]);

    // set indicator variables
    const indicatorPassResult = await Promise.all([
      countyIndicatorPass(yearT0Filter),
      rangerDistrictIndicatorPass(yearT0Filter),
    ]);

    // generate predictions
    const predictionResult = await Promise.all([
      countyGenerateAllPredictions(yearT0Filter),
      rangerDistrictGenerateAllPredictions(yearT0Filter),
    ]);

    console.log('FINISHED RUNNING PIPELINE');

    return {
      summarizeResult,
      yearT2PassResult,
      yearT1PassResult,
      indicatorPassResult,
      predictionResult,
    };
  } catch (error) {
    console.log('ERROR RUNNING PIPELINE');
    console.log(error);
    return error;
  }
};
