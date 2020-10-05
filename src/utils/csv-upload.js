import path from 'path';
import fs from 'fs';
import { parse } from 'json2csv';
import { parseFile } from 'fast-csv';

import { newError } from './responses';
import { RESPONSE_TYPES } from '../constants';

/**
 * @description higher-order function that creates a csv caster function
 * @param {Object} row csv row of data
 * @param {Object} payload data or error info to send
 * @returns {(row: Object) => Object} function that casts a single row
 */
export const cleanCsvCreator = (map) => (row) => {
  const cleanedArray = Object.entries(row)
    .map(([csvKey, value]) => [map[csvKey], value])
    .filter(([newKey]) => !!newKey);
  return Object.fromEntries(cleanedArray);
};

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
 * @description higher-order function that creates a csv uploader function
 * @param {mongoose.Model} ModelName destination Model of upload
 * @param {function} cleanCsv function to cast csv to model schema
 * @param {function} cleanBody function to validate that all model schema parameters are present
 * @param {string} filename csv filename on disk
 * @returns {(filename: String) => Promise}
 * @throws RESPONSE_TYPES.BAD_REQUEST for missing fields
 * @throws other errors depending on what went wrong
 */
export const csvUploadCreator = (ModelName, cleanCsv, cleanBody) => async (filename) => {
  const filepath = path.resolve(__dirname, `../../${filename}`);

  const docs = [];

  return new Promise((resolve, reject) => {
    parseFile(filepath, { headers: true })
      .on('data', (data) => {
        // cast the csv fields to our schema
        const cleanedData = cleanBody(cleanCsv(data));
        if (!cleanedData) reject(newError(RESPONSE_TYPES.BAD_REQUEST, 'missing fields in csv'));

        docs.push(cleanedData);
      })
      .on('error', (err) => reject(err))
      .on('end', (rowCount) => {
        ModelName.insertMany(docs)
          .then((res) => {
            console.log(`successfully parsed ${rowCount} rows from csv upload`);
            resolve(res);
          });
      });
  });
};

/**
 * @description higher-order function that creates a csv downloader function
 * @param {mongoose.Model} ModelName destination Model of download
 * @param {Array<String>} fields model attributes in array (used for fields of the csv file)
 * @returns {Function} which when envoked, returns a filepath to a CSV of the collection contents
 * @throws RESPONSE_TYPES.INTERNAL_ERROR for trouble parsing
 */
export const csvDownloadCreator = (ModelName, fields) => async () => {
  const data = await ModelName.find({});

  try {
    const csv = parse(data, { fields });
    const filepath = path.resolve(__dirname, `../../uploads/${Math.random().toString(36).substring(7)}.csv`);

    fs.writeFileSync(filepath, csv);

    return filepath;
  } catch (err) {
    console.error(err);
    throw newError(RESPONSE_TYPES.INTERNAL_ERROR, err.toString());
  }
};
