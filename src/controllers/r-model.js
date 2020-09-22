/* eslint-disable new-cap */
import path from 'path';

const R = require('r-script');

const rpath = path.resolve(__dirname, '../r-scripts/SPB-Predictions.v02.R');

export default (SPB, cleridst1, spotst1, spotst2, endobrev) => {
  return new Promise((resolve, reject) => {
    R(rpath)
      .data({
        SPB: parseInt(SPB, 10),
        cleridst1: parseInt(cleridst1, 10),
        spotst1: parseInt(spotst1, 10),
        spotst2: parseInt(spotst2, 10),
        endobrev: parseInt(endobrev, 10),
      })
      .call((error, d) => {
        if (error) {
          console.log(error);
          reject(error);
        } else {
          resolve(d);
        }
      });
  });
};
