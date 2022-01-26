import path from 'path';
import fs from 'fs';
import { parse } from 'json2csv';
import { parseFile } from 'fast-csv';

import { newError } from './responses';
import { RESPONSE_TYPES } from '../constants';

/**
 * @description returns provided value if is a number, else returns fallback
 * @param {number} value numerical value to test
 * @param {any} [fallback=null] value to return if provided value is not a number
 * @returns value
 */
export const validateNumberEntry = (value, fallback = null) => (value === undefined || value === null || value === '' ? fallback : value);

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
 * @description extracts the compound index from a model
 * @param {Model} Model the mongoose model wanted
 * @returns {Array<String>} array of string index names
 */
export const getIndexes = (Model) => {
  const indexes = Model.schema.indexes();
  return Object.keys(indexes.find(([_idx, attr]) => !!attr.unique)[0]);
};

/**
 * higher-order function that creates an upsert operation
 * @param {Array<String>} indexes the indexes to match uniqueness on
 * @param {Object} data the data operated on
 * @returns (Function) to feed into bulkWrite
 */
export const upsertOpCreator = (indexes) => (data) => ({
  updateOne: {
    filter: Object.fromEntries(indexes.map((index) => [index, data[index]])),
    update: data,
    upsert: true,
  },
});

/**
 * @description higher-order function that creates a csv uploader function
 * @param {mongoose.Model} ModelName destination Model of upload
 * @param {function} cleanCsv function to cast csv to model schema
 * @param {function} cleanBody function to validate that all model schema parameters are present
 * @param {function} filter optional parameter to conditionally accept documents
 * @param {function} transform optional parameter to modify a document before insertion
 * @param {function} upsertOp the correct upsert technique to use based on index filters
 * @param {string} filename csv filename on disk
 * @returns {(filename: String) => Promise}
 * @throws RESPONSE_TYPES.BAD_REQUEST for missing fields
 * @throws other errors depending on what went wrong
 */
export const csvUploadCreator = (ModelName, cleanCsv, cleanBody, filter, transform, upsert) => async (filename) => {
  const filepath = path.resolve(__dirname, `../../${filename}`);

  const docs = [];
  const filteredOutRows = [];

  return new Promise((resolve, reject) => {
    parseFile(filepath, { headers: true })
      .on('data', (data) => {
        // cast the csv fields to our schema
        const cleanedData = cleanBody(cleanCsv(data));
        if (!cleanedData) reject(newError(RESPONSE_TYPES.BAD_REQUEST, 'missing fields in csv'));

        // apply filter if it exists
        if (!filter || filter(cleanedData)) {
          // apply transformation if it exists
          docs.push(transform ? transform(cleanedData) : cleanedData);
        } else {
          filteredOutRows.push(data);
        }
      })
      .on('error', (err) => reject(err))
      .on('end', (rowCount) => {
        // apply another transformation to prepare for upserting
        const upsertOp = docs.map(upsert);
        ModelName.bulkWrite(upsertOp)
          .then((res) => {
            const numRowsMessage = `successfully parsed ${rowCount} rows from csv upload`;
            const numFilteredMessage = filteredOutRows.length > 0 ? `filtered out ${filteredOutRows.length} rows` : '';
            console.log(`${numRowsMessage}. ${numFilteredMessage}`);

            resolve({
              bulkWriteResult: res,
              filteredOutRows,
            });
          })
          .catch((err) => reject(err));
      });
  });
};

/**
 * @description higher-order function that creates a csv downloader function
 * @param {mongoose.Model} ModelName destination Model of download
 * @param {Array<String>} fields model attributes in array (used for fields of the csv file)
 * @param {Boolean} containsPredictionData flag for if prediction field should be spread to columns
 * @returns {(filters: Object) => Promise<String>} which when invoked, returns a filepath to a CSV of the collection contents
 * @throws RESPONSE_TYPES.INTERNAL_ERROR for trouble parsing
 */
export const csvDownloadCreator = (ModelName, fields, containsPredictionData = false) => async (filters) => {
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
    let data = await query
      .sort(ModelName.schema.indexes()[0][0])
      .exec();

    // spread the predictions object to individual columns
    if (containsPredictionData) {
      data = data.map((obj) => ({
        ...obj._doc,
        ...obj.prediction,
      }));
    }

    const csv = parse(data, {
      fields: containsPredictionData
        ? [...fields, ...Object.keys(data[0]?.prediction || {})]
        : fields,
    });

    const filepath = path.resolve(__dirname, `../../uploads/${Math.random().toString(36).substring(7)}.csv`);

    fs.writeFileSync(filepath, csv);

    return filepath;
  } catch (err) {
    console.error(err);
    throw newError(RESPONSE_TYPES.INTERNAL_ERROR, err.toString());
  }
};
