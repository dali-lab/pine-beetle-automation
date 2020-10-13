/* eslint-disable import/prefer-default-export */
/* eslint-disable new-cap */
import path from 'path';
import R from 'r-script';

const rpath = path.resolve(__dirname, '../r-scripts/SPB-Predictions.v02.R');

export const runModel = (SPB = 0, cleridst1 = 0, spotst1 = 0, spotst2 = 0, endobrev = 0) => {
  return new Promise((resolve, reject) => {
    R(rpath)
      .data({
        cleridst1: parseInt(cleridst1, 10),
        endobrev: parseInt(endobrev, 10),
        SPB: parseInt(SPB, 10),
        spotst1: parseInt(spotst1, 10),
        spotst2: parseInt(spotst2, 10),
      })
      .call((error, d) => {
        if (error) {
          reject(error);
        } else {
          resolve(d);
        }
      });
  });
};
