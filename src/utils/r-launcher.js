/* eslint-disable import/prefer-default-export */
import path from 'node:path';
import { spawn } from 'node:child_process';

import { newError } from './responses';
import { RESPONSE_TYPES } from '../constants';

/**
 * rewritten version of r-script npm package to asyncronously call an R script
 * check https://github.com/joshkatz/r-script/blob/master/index.js for original code
 *
 * uses stdin to pipe input into R instead of env variables, since the original
 * package caused E2BIG with large amounts of input.
 * this is because there's a kernel-based limit on how many bytes can be in
 * command line args + env variables, and the original package would use env variables
 * to send all the data. stdin should be unbounded so this works better.
 *
 * @param {string} rPath path to R script to run
 * @param {...Object} dataArgs data to pass to script
 * @returns {Promise<Object[]>} output from R
 */
export const callRScript = async (rPath, ...dataArgs) => {
  // these options are passed to jsonlite for toJSON
  // https://github.com/jeroenooms/jsonlite/blob/master/R/toJSON.R
  const options = {};

  const args = ['--vanilla', path.resolve(__dirname, '../r-scripts/launch.R')];

  // this is just to stay consistent with npm package r-script
  const inputData = dataArgs.reduce((acc, arg, i) => ({
    ...acc,
    [i + 1]: arg,
  }), {});

  const child = spawn('Rscript', args);

  // needs newline at the end; or else R complains and throws an error
  const input = `${JSON.stringify([inputData, rPath, options])}\n`;
  child.stdin.end(input);

  return new Promise((resolve, reject) => {
    child.stderr.on('data', (error) => {
      // error comes in as a buffer, so it needs to become a string
      return reject(newError(RESPONSE_TYPES.INTERNAL_ERROR, error.toString()));
    });

    let body = '';
    child.stdout.on('data', (d) => {
      body += d;
    });

    child.on('close', (exitCode) => {
      try {
        // don't resolve if a non-zero error code happened bc we should have rejected already
        if (exitCode === 0) {
          resolve(JSON.parse(body));
        }
        if (exitCode !== 0) {
          reject();
        }
      } catch (error) {
        reject(error);
      }
    });
  });
};
