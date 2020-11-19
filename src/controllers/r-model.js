/* eslint-disable import/prefer-default-export */
/* eslint-disable no-restricted-globals */
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

    if (SPB === null || isNaN(SPB) || isNaN(cleridst1)
    || spotst1 === null || isNaN(spotst1) || spotst2 === null || isNaN(spotst2)
    || endobrev === null || isNaN(endobrev)) {
      throw newError(RESPONSE_TYPES.INTERNAL_ERROR, 'bad format for R model');
    }

    const allValidInput = [SPB, cleridst1, spotst1, spotst2, endobrev].reduce((acc, curr) => (
      acc && (curr === null || curr >= 0)
    ), true);

    if (!allValidInput) {
      throw newError(RESPONSE_TYPES.INTERNAL_ERROR, 'bad format for R model, no negatives allowed');
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
