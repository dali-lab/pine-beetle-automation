/* eslint-disable import/prefer-default-export */
/* eslint-disable new-cap */
import path from 'path';
import R from 'r-script';

const rpath = path.resolve(__dirname, '../r-scripts/SPB-Predictions.v02.R');

export const runModel = (SPB, cleridst1, spotst1, spotst2, endobrev) => {
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
