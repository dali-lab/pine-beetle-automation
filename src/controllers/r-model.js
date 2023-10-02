import path from 'path';
import {
  callRScript,
  newError,
} from '../utils';
import { RESPONSE_TYPES } from '../constants';

const rCalculatedFieldsPath = path.resolve(__dirname, '../r-scripts/Calculated-Outcome-Fields.R');

const rPredictionPaths = {
  2018: path.resolve(__dirname, '../r-scripts/SPB-Predictions.v02-DALI.R'),
  2023: path.resolve(__dirname, '../r-scripts/SPB-Predictions.v2.0.R'),
};

/**
 * runs the r model by feeding it an array of entries
 * @param {Array} array the data
 * @param {Number} modelVersion version of the model to use in predictions
 * @returns {Promise<Array>} finished predictions
 */
export const runModel = (array, modelVersion) => {
  const data = array.map((doc) => {
    const {
      cleridst1,
      endobrev,
      SPB,
      spotst1,
      spotst2,
    } = doc;

    // null check
    const noInvalidNulls = [SPB, spotst1, spotst2, endobrev].reduce((acc, curr) => (
      acc && curr !== null
    ), true);

    // not a number check
    const noInvalidNaNs = [SPB, cleridst1, spotst1, spotst2, endobrev].reduce((acc, curr) => (
      acc && !Number.isNaN(curr)
    ), true);

    // non-negative check -- allows a null for cleridst1 to pass through
    const noInvalidNegatives = [SPB, cleridst1, spotst1, spotst2, endobrev].reduce((acc, curr) => (
      acc && (curr === null || curr >= 0)
    ), true);

    if (!(noInvalidNulls && noInvalidNaNs && noInvalidNegatives)) {
      throw newError(RESPONSE_TYPES.BAD_REQUEST, 'Bad format for R model');
    }

    return {
      cleridst1: cleridst1 ?? 77, // default to 77 if null or undefined
      endobrev,
      SPB,
      spotst1,
      spotst2,
    };
  });

  if (!data.length) return data;

  return callRScript(rPredictionPaths[modelVersion], { data });
};

/**
 * runs the r script for calculating outcome fields by feeding it an array of entries
 * @param {Array} array the data
 * @returns {Promise<Array>} finished calculations
 */
export const generateCalculatedFields = (array) => {
  const data = array.map((doc) => {
    const {
      cleridsPer2Weeks,
      probSpotsGT50,
      spbPer2Weeks,
      spotst0,
    } = doc;

    return {
      spbPer2Weeks,
      cleridsPer2Weeks,
      spotst0,
      probSpotsGT50,
    };
  });

  if (!data.length) return data;

  return callRScript(rCalculatedFieldsPath, { data });
};
