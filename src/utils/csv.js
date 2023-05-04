import path from 'path';
import fs from 'fs';
import { parse } from 'json2csv';
import { parseFile } from 'fast-csv';

import { newError } from './responses';
import { RESPONSE_TYPES } from '../constants';

/**
 * @description deletes a file WARNING VERY SPOOKY
 * @param {Object} filename multer file to delete
 * @param {Boolean} [isAbsolutePath] optional param for if user supplied absolute path
 * @returns {Promise}
 */
export const deleteFile = async (filename, isAbsolutePath) => {
  const filepath = isAbsolutePath ? filename : path.resolve(__dirname, `../../${filename}`);

  return new Promise((resolve) => {
    fs.unlink(filepath, (err) => {
      if (err) console.log(err);
      resolve();
    });
  });
};

/**
 * @description processes CSV file into array of objects
 * @param {String} filename name of CSV file to upload
 * @param {Function} [transformRow] optional function to transform a row of data
 * @returns {Promise<{ docs: Object[], rowCount: Number}>} function that takes in filename of CSV and returns promise
 */
export const processCSV = (filename, transformRow = (r) => r) => {
  const filepath = path.resolve(__dirname, `../../${filename}`);
  const docs = [];

  return new Promise((resolve, reject) => {
    parseFile(filepath, { headers: true })
      .on('data', (data) => docs.push(transformRow(data)))
      .on('error', (err) => reject(err))
      .on('end', (rowCount) => resolve({ docs, rowCount }));
  });
};

/**
 * @description processes CSV file into array of objects, allows async transformation of row
 * @param {String} filename name of CSV file to upload
 * @param {Function} [transformRow] optional async function to transform a row of data
 * @returns {Promise<{ docs: Object[], rowCount: Number}>} function that takes in filename of CSV and returns promise
 */
export const processCSVAsync = (filename, transformRow = (r) => Promise.resolve(r)) => {
  const filepath = path.resolve(__dirname, `../../${filename}`);
  const promises = [];

  return new Promise((resolve, reject) => {
    parseFile(filepath, { headers: true })
      .on('data', (data) => promises.push(transformRow(data).catch(reject)))
      .on('error', (err) => reject(err))
      .on('end', async (rowCount) => {
        const docs = await Promise.all(promises).catch(reject);
        resolve({ docs, rowCount });
      });
  });
};

/**
 * @description higher-order function that creates a csv downloader function
 * @param {mongoose.Model} ModelName destination Model of download
 * @param {Array<String>} fields model attributes in array (used for fields of the csv file)
 * @returns {(filters: Object) => Promise<String>} which when invoked, returns a filepath to a CSV of the collection contents
 * @throws RESPONSE_TYPES.INTERNAL_ERROR for trouble parsing
 */
export const csvDownloadCreator = (ModelName, fields) => async (filters) => {
  const {
    county,
    endYear,
    rangerDistrict,
    startYear,
    state,
  } = filters;

  try {
    const query = ModelName.find();

    // optional filters
    if (startYear) query.find({ year: { $gte: parseInt(startYear, 10) } });
    if (endYear) query.find({ year: { $lte: parseInt(endYear, 10) } });
    if (state) query.find({ state });
    if (county) query.find({ county });
    if (rangerDistrict) query.find({ rangerDistrict });

    // use compound key to sort before sending the file
    const data = await query
      .sort(ModelName.schema.indexes()[0][0])
      .exec();

    const csv = parse(data, { fields });

    const filepath = path.resolve(__dirname, `../../uploads/${Math.random().toString(36).substring(7)}.csv`);

    fs.writeFileSync(filepath, csv);

    return filepath;
  } catch (err) {
    console.error(err);
    throw newError(RESPONSE_TYPES.INTERNAL_ERROR, err.toString());
  }
};
