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

import { RESPONSE_TYPES } from '../constants';
import { newError } from '../utils';

// start year that we should modify data (allows us to leave all 2020 and prior data alone)
const CUTOFF_YEAR = 2021;

// lock variables for pipeline
let mutexLock = false;
let queued = false;

/**
 * @description runs the entire pipeline (summarize data, generate predictions)
 * @param {Number} [cutoffYear=2021] start year that data should be modified for
 * @param {Boolean} [options.inQueue=false] only flag as true if this has priority in queue
 * @returns {Promise<Object>} result of each operation
 */
export const runPipelineAll = async (options = { inQueue: false }) => {
  // This queuing system exists to prevent two concurrent pipeline runs, which rarely causes (temporary)
  // data corruption. It implements a mutex lock and a retrying queue of length 1 to do this.
  // this is theoretically still vulnerable to mid-pipeline crash errors and if two servers run pipeline
  // on the same database.
  // a more robust method would use transactions, but that would incur a ~20% slowdown and need a partial
  // rewrite of the summarization pipeline. ($merge is unsupported by transactions.)
  const { inQueue } = options;

  if (queued && !inQueue) {
    console.warn('pipeline running and queue full. aborting.');
    throw newError(RESPONSE_TYPES.BAD_REQUEST, 'pipeline already running, rerun not needed');
  }

  if (mutexLock) { // pseudo-mutex-lock for ensuring only one pipeline runs at once
    queued = true;

    const delayMs = 5000;
    console.warn(`pipeline already running. retrying in ${delayMs} ms.`);

    const sleep = new Promise((res) => { setTimeout(res, delayMs); });
    await sleep;

    console.warn('retrying running pipeline');
    // give it the inQueue flag to indicate that it's the single queued job
    return runPipelineAll({ inQueue: true });
  }

  // entering the main body means nothing is queued (or we just exited queue),
  // and lock should be acquired.
  queued = false;
  mutexLock = true;

  console.time('PIPELINE');
  console.log('RUNNING PIPELINE, engaging lock');

  const yearT0Filter = { year: { $gte: CUTOFF_YEAR } };
  const yearT1Filter = { year: { $gte: CUTOFF_YEAR - 1 } };
  const yearT2Filter = { year: { $gte: CUTOFF_YEAR - 2 } };

  try {
    // set spbPer2Weeks values to null for all summarized (within year filter)
    // after summarization, if spbPer2Weeks is still null, then hasSPBTrapping will be
    // set to 0 in the indicator pass, which will flag a row to be deleted
    // in the stale row pass iff there is also no spotst0 data
    console.time('CLEAR');
    console.log('CLEAR BEGIN');
    const clearResult = await Promise.all([
      countyClearAll(yearT0Filter),
      rangerDistrictClearAll(yearT0Filter),
    ]);
    console.timeEnd('CLEAR');

    // summarize county and ranger district data
    console.time('SUMMARIZE');
    console.log('SUMMARIZE BEGIN');
    const summarizeResult = await Promise.all([
      countySummarizeAll(yearT0Filter),
      rangerDistrictSummarizeAll(yearT0Filter),
    ]);
    console.timeEnd('SUMMARIZE');

    // generate spotst2
    console.time('T2');
    console.log('T2 BEGIN');
    const yearT2PassResult = await Promise.all([
      countyYearT2Pass(yearT2Filter),
      rangerDistrictYearT2Pass(yearT2Filter),
    ]);
    console.timeEnd('T2');

    // generate spotst1 & cleridst1
    console.time('T1');
    console.log('T1 BEGIN');
    const yearT1PassResult = await Promise.all([
      countyYearT1Pass(yearT1Filter),
      rangerDistrictYearT1Pass(yearT1Filter),
    ]);
    console.timeEnd('T1');

    // set indicator variables
    // This is the current bottleneck at around 35% of runtime.
    // can be sped up by using $merge and aggregation pipelines but that
    // is not compatible if transactions are wanted.
    console.time('INDICATOR');
    console.log('INDICATOR BEGIN');
    const indicatorPassResult = await Promise.all([
      countyIndicatorPass(yearT0Filter),
      rangerDistrictIndicatorPass(yearT0Filter),
    ]);
    console.timeEnd('INDICATOR');

    // delete rows where no trapping or spot data exists (and therefore no predictions either)
    console.time('DELETESTALE');
    console.log('DELETESTALE BEGIN');
    const deleteStaleRowsResult = await Promise.all([
      countyDeleteStaleRows(yearT0Filter),
      rangerDistrictDeleteStaleRows(yearT0Filter),
    ]);
    console.timeEnd('DELETESTALE');

    // generate predictions
    console.time('PREDICTION');
    console.log('PREDICTION BEGIN');
    const predictionResult = await Promise.all([
      countyGenerateAllPredictions(yearT0Filter),
      rangerDistrictGenerateAllPredictions(yearT0Filter),
    ]);
    console.timeEnd('PREDICTION');

    // generate calculated fields
    console.time('CALCULATED');
    console.log('CALCULATED BEGIN');
    const calculatedFieldsResult = await Promise.all([
      countyGenerateAllCalculatedFields(yearT0Filter),
      rangerDistrictGenerateAllCalculatedFields(yearT0Filter),
    ]);
    console.timeEnd('CALCULATED');

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
    console.error('ERROR RUNNING PIPELINE');
    throw error;
  } finally {
    mutexLock = false;
    console.timeEnd('PIPELINE');
    console.log('releasing lock');
  }
};

/**
 * @description runs indicator and calculated fields pipeline
 * @param {Number} startYear
 * @param {Number} endYear
 * @returns {Promise<Object>} result of each operation
 */
export const runIndicatorCalculatorPipelineYears = async (startYear, endYear) => {
  if (startYear + 5 <= endYear) {
    throw newError(RESPONSE_TYPES.BAD_REQUEST, 'please only run indicator pipeline for maximum five year interval (four years between start and end year)');
  }

  const filter = { year: { $gte: startYear, $lte: endYear } };

  // set indicator variables
  const indicatorPassResult = await Promise.all([
    countyIndicatorPass(filter),
    rangerDistrictIndicatorPass(filter),
  ]);

  // generate calculated fields
  const calculatedFieldsResult = await Promise.all([
    countyGenerateAllCalculatedFields(filter),
    rangerDistrictGenerateAllCalculatedFields(filter),
  ]);

  return {
    indicatorPassResult,
    calculatedFieldsResult,
  };
};
