/* eslint-disable import/prefer-default-export */
/* eslint-disable new-cap */
import path from 'path';
import R from 'r-script';
import { newError } from '../utils';
import { RESPONSE_TYPES } from '../constants';

const rpath = path.resolve(__dirname, '../r-scripts/SPB-Predictions.v02-DALI.R');

/**
 * runs the r model by feeding it an array of entries
 * @param {Array} array the data
 * @returns {Promise<Array>} finished predictions
 */
export const runModel = (array) => {
  const data = array.map((doc) => {
    const {
      cleridst1,
      endobrev,
      SPB,
      spotst1,
      spotst2,
    } = doc;

    // null check
    const unallowedNulls = [SPB, spotst1, spotst2, endobrev].reduce((acc, curr) => (
      acc && curr !== null
    ), true);

    // not a number check
    const unallowedNaNs = [SPB, cleridst1, spotst1, spotst2, endobrev].reduce((acc, curr) => (
      acc && !Number.isNaN(curr)
    ), true);

    // non-negative check -- allows a null for cleridst1 to pass through
    const unallowedNegatives = [SPB, cleridst1, spotst1, spotst2, endobrev].reduce((acc, curr) => (
      acc && (curr === null || curr >= 0)
    ), true);

    if (unallowedNulls || unallowedNaNs || unallowedNegatives) {
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

  return new Promise((resolve, reject) => {
    if (!data.length) {
      resolve(data);
    } else {
      R(rpath)
        .data({ data })
        .call((error, d) => {
          if (error) {
            reject(error);
          } else {
            resolve(d);
          }
        });
    }
  });
};
