import {
  summarizeAll as countySummarizeAll,
//   summarizeStateYear as countySummarizeStateYear,
} from './summarized-county';

import {
  summarizeAll as rangerDistrictSummarizeAll,
//   summarizeStateYear as rangerDistrictSummarizeStateYear,
} from './summarized-rangerdistrict';

// import {
//   generateStateYearPredictions as countyGenerateStateYearPredictions,
//   generateAllPredictions as countyGenerateAllPredictions,
// } from './county-prediction';

// import {
//   generateStateYearPredictions as rangerDistrictGenerateStateYearPredictions,
//   generateAllPredictions as rangerDistrictGenerateAllPredictions,
// } from './rd-prediction';

const ignoreAllPre2021Filter = {
  year: { $gte: 2021 },
};

export const runPipelineAll = async () => {
  console.log('RUNNING PIPELINE');

  try {
    // summarize county and ranger district data
    const summarizeResult = await Promise.all([
      countySummarizeAll(ignoreAllPre2021Filter),
      rangerDistrictSummarizeAll(ignoreAllPre2021Filter),
    ]);

    // append spot data
    // const spotAppendResult = await Promise.all([
    //   mergeCountySpots('t2'),
    //   mergeCountySpots('t1'),
    //   mergeCountySpots('t0'),
    //   mergeRangerDistrictSpots('t2'),
    //   mergeRangerDistrictSpots('t1'),
    //   mergeRangerDistrictSpots('t0'),
    // ]);

    // generate predictions
    const predictionResult = await Promise.all([
      // countyGenerateAllPredictions(),
      // rangerDistrictGenerateAllPredictions(),
    ]);

    console.log('FINISHED RUNNING PIPELINE');

    return {
      predictionResult,
      // spotAppendResult,
      summarizeResult,
    };
  } catch (error) {
    console.log('ERROR RUNNING PIPELINE');
    console.log(error);
    return error;
  }
};

/**
 * runs pipeline by summarizing data, appending spot data, and generating predictions
 * @param {String} state state to aggregate and predict on
 * @param {String} year year to aggregate and predict on
 * @returns {Promise<Object>} result data of each bulk operation
 */
export const runPipelineStateYear = async (state, rawYear = '0') => {
//   const year = parseInt(rawYear, 10);

  //   console.log(`RUNNING PIPELINE ON STATE ${state}, YEAR ${year}`);

  //   try {
  //     // drop all summarized data and predictions
  //     const deleteResult = await Promise.all([
  //       countySummarizeDeleteStateYear(state, year),
  //       rangerDistrictSummarizeDeleteStateYear(state, year),
  //       // countyPredictionDeleteStateYear(state, year),
  //       // rangerDistrictPredictionDeleteStateYear(state, year),
  //     ]);

  //     // summarize county and ranger district data
  //     const summarizeResult = await Promise.all([
  //       countySummarizeStateYear(state, year),
  //       rangerDistrictSummarizeStateYear(state, year),
  //     ]);

  //     // // append spot data
  //     // const spotAppendResult = await Promise.all([
  //     //   mergeCountySpots('t2', year - 2, state),
  //     //   mergeCountySpots('t1', year - 1, state),
  //     //   mergeCountySpots('t0', year, state),
  //     //   mergeRangerDistrictSpots('t2', year - 2, state),
  //     //   mergeRangerDistrictSpots('t1', year - 1, state),
  //     //   mergeRangerDistrictSpots('t0', year, state),
  //     // ]);

  //     // generate predictions
  //     const predictionResult = await Promise.all([
  //       // countyGenerateStateYearPredictions(state, year),
  //       // rangerDistrictGenerateStateYearPredictions(state, year),
  //     ]);

  //     console.log(`FINISHED RUNNING PIPELINE ON STATE ${state}, YEAR ${year}`);

//     return {
//       deleteResult,
//       predictionResult,
//       // spotAppendResult,
//       summarizeResult,
//     };
//   } catch (error) {
//     console.log(`ERROR RUNNING PIPELINE ON STATE ${state}, YEAR ${year}`);
//     console.log(error);
//     return error;
//   }
};
