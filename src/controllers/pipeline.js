/* eslint-disable import/prefer-default-export */
import {
  clearAll as countyClearAll,
  deleteStaleRows as countyDeleteStaleRows,
  summarizeAll as countySummarizeAll,
  yearT1Pass as countyYearT1Pass,
  yearT2Pass as countyYearT2Pass,
  indicatorPass as countyIndicatorPass,
  generateAllPredictions as countyGenerateAllPredictions,
  generateAllCalculatedFields as countyGenerateAllCalculatedFields,
} from './summarized-county';

import {
  clearAll as rangerDistrictClearAll,
  deleteStaleRows as rangerDistrictDeleteStaleRows,
  summarizeAll as rangerDistrictSummarizeAll,
  yearT1Pass as rangerDistrictYearT1Pass,
  yearT2Pass as rangerDistrictYearT2Pass,
  indicatorPass as rangerDistrictIndicatorPass,
  generateAllPredictions as rangerDistrictGenerateAllPredictions,
  generateAllCalculatedFields as rangerDistrictGenerateAllCalculatedFields,
} from './summarized-rangerdistrict';

// start year that we should modify data (allows us to leave all 2020 and prior data alone)
const CUTOFF_YEAR = 2021;

/**
 * @description runs the entire pipeline (summarize data, generate predictions)
 * @param {Number} [cutoffYear=2021] start year that data should be modified for
 * @returns {Promise<Object>} result of each operation
 */
export const runPipelineAll = async () => {
  console.log('RUNNING PIPELINE');

  const yearT0Filter = { year: { $gte: CUTOFF_YEAR } };
  const yearT1Filter = { year: { $gte: CUTOFF_YEAR - 1 } };
  const yearT2Filter = { year: { $gte: CUTOFF_YEAR - 2 } };

  try {
    // set spbPer2Weeks values to null for all summarized (within year filter)
    // after summarization, if spbPer2Weeks is still null, then hasSPBTrapping will be
    // set to 0 in the indicator pass, which will flag a row to be deleted
    // in the stale row pass iff there is also no spotst0 data
    const clearResult = await Promise.all([
      countyClearAll(yearT0Filter),
      rangerDistrictClearAll(yearT0Filter),
    ]);

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

    // delete rows where no trapping or spot data exists (and therefore no predictions either)
    const deleteStaleRowsResult = await Promise.all([
      countyDeleteStaleRows(yearT0Filter),
      rangerDistrictDeleteStaleRows(yearT0Filter),
    ]);

    // generate predictions
    const predictionResult = await Promise.all([
      countyGenerateAllPredictions(yearT0Filter),
      rangerDistrictGenerateAllPredictions(yearT0Filter),
    ]);

    // generate calculated fields
    const calculatedFieldsResult = await Promise.all([
      countyGenerateAllCalculatedFields(yearT0Filter),
      rangerDistrictGenerateAllCalculatedFields(yearT0Filter),
    ]);

    console.log('FINISHED RUNNING PIPELINE');

    return {
      clearResult,
      summarizeResult,
      yearT2PassResult,
      yearT1PassResult,
      indicatorPassResult,
      deleteStaleRowsResult,
      predictionResult,
      calculatedFieldsResult,
    };
  } catch (error) {
    console.log('ERROR RUNNING PIPELINE');
    console.log(error);
    return error;
  }
};
