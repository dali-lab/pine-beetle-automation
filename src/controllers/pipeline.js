/* eslint-disable sort-keys */
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

// year before which we want to leave the data unmodified
const CUTOFF_YEAR = 2021;

const yearT0Filter = {
  year: { $gte: CUTOFF_YEAR },
};

const yearT1Filter = {
  year: { $gte: CUTOFF_YEAR - 1 },
};

const yearT2Filter = {
  year: { $gte: CUTOFF_YEAR - 2 },
};

export const runPipelineAll = async () => {
  console.log('RUNNING PIPELINE');

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
      predictionResult,
      indicatorPassResult,
    };
  } catch (error) {
    console.log('ERROR RUNNING PIPELINE');
    console.log(error);
    return error;
  }
};
