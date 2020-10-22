/* eslint-disable import/prefer-default-export */
/* eslint-disable no-restricted-globals */
/* eslint-disable new-cap */
import path from 'path';
import R from 'r-script';
import { newError } from '../utils';
import { RESPONSE_TYPES } from '../constants';

// const rpath = path.resolve(__dirname, '../r-scripts/SPB-Predictions.v02.R');

// export const runModel = (SPB = 0, cleridst1 = 0, spotst1 = 0, spotst2 = 0, endobrev = 0) => {
//   return new Promise((resolve, reject) => {
//     R(rpath)
//       .data({
//         cleridst1: parseInt(cleridst1, 10),
//         endobrev: parseInt(endobrev, 10),
//         SPB: parseInt(SPB, 10),
//         spotst1: parseInt(spotst1, 10),
//         spotst2: parseInt(spotst2, 10),
//       })
//       .call((error, d) => {
//         if (error) {
//           reject(error);
//         } else {
//           resolve(d);
//         }
//       });
//   });
// };
//
// const csvCreateHelper = (cleanedData) => {
//   const csv = parse(cleanedData, { fields: ['cleridst1', 'endobrev', 'SPB', 'spotst1', 'spotst2'] });
//   const filepath = path.resolve(__dirname, '../../uploads/Model-in.csv');
//   fs.writeFileSync(filepath, csv);
// };

const rpath = path.resolve(__dirname, '../r-scripts/SPB-Predictions.v02-DALI.R');

export const runModel = (array) => {
  const data = array.map((doc) => {
    const {
      cleridst1,
      endobrev,
      SPB,
      spotst1,
      spotst2,
    } = doc;

    if (SPB === null || isNaN(SPB) || cleridst1 === null || isNaN(cleridst1)
    || spotst1 === null || isNaN(spotst2) || spotst2 === null || isNaN(spotst2)
    || endobrev === null || isNaN(endobrev)) {
      throw newError(RESPONSE_TYPES.INTERNAL_ERROR, 'bad format for R model');
    }

    return {
      cleridst1,
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
      // csvCreateHelper(input);
      console.log(data);
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
