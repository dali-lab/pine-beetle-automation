import { stringify } from 'csv-stringify';
import { parseFile } from 'fast-csv';
import fs from 'fs';
import { parse } from 'json2csv';
import path from 'path';

import { RESPONSE_TYPES } from '../constants';
import { newError } from './responses';

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
 * @param {Function} [transformRow] optional function to transform a row of data; receives (row, rowNumber)
 * @param {Object} [options]
 * @param {Boolean} [options.collectErrors=false] when true, per-row throws are captured in `rejections` instead of failing the whole parse
 * @returns {Promise<{ docs: Object[], rowCount: Number, rejections: Array}>}
 */
export const processCSV = (filename, transformRow = (r) => r, options = {}) => {
  const { collectErrors = false } = options;
  const filepath = path.resolve(__dirname, `../../${filename}`);
  const docs = [];
  const rejections = [];
  let failed = false;
  let rowNumber = 0;

  return new Promise((resolve, reject) => {
    const stream = parseFile(filepath, { headers: true });

    stream
      .on('data', (data) => {
        if (failed) return;
        rowNumber += 1;
        const currentRow = rowNumber;
        try {
          docs.push(transformRow(data, currentRow));
        } catch (err) {
          if (collectErrors) {
            rejections.push({ rowNumber: currentRow, error: err, raw: data });
          } else {
            failed = true;
            stream.destroy();
            reject(err);
          }
        }
      })
      .on('error', (err) => {
        if (!failed) {
          failed = true;
          reject(err);
        }
      })
      .on('end', (rowCount) => {
        if (!failed) resolve({ docs, rowCount, rejections });
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

    if (startYear) query.find({ year: { $gte: parseInt(startYear, 10) } });
    if (endYear) query.find({ year: { $lte: parseInt(endYear, 10) } });
    if (state) query.find({ state });
    if (county) query.find({ county });
    if (rangerDistrict) query.find({ rangerDistrict });

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

/**
 * @description Creates a streaming CSV download function that doesn't load all data into memory
 * Supports downloading all data if no year filters are provided
 * @param {mongoose.Model} ModelName destination Model of download
 * @param {Array<String>} fields model attributes in array (used for fields of the csv file)
 * @param {String} [fileName='export.csv'] optional file name for the downloaded CSV
 * @returns {(filters: Object, res: Response) => Promise<void>} streaming function
 * @throws RESPONSE_TYPES.BAD_REQUEST for invalid parameters
 * @throws RESPONSE_TYPES.INTERNAL_ERROR for trouble parsing CSV
 */
export const csvStreamDownloadCreator = (ModelName, fields, fileName = 'export.csv') => async (filters, res) => {
  const {
    county,
    endYear,
    rangerDistrict,
    startYear,
    state,
  } = filters;

  const hasStartYear = startYear !== undefined && startYear !== '' && startYear !== null;
  const hasEndYear = endYear !== undefined && endYear !== '' && endYear !== null;

  let parsedStartYear;
  let parsedEndYear;

  if (hasStartYear) {
    parsedStartYear = parseInt(startYear, 10);
    if (Number.isNaN(parsedStartYear)) {
      throw newError(RESPONSE_TYPES.BAD_REQUEST, 'startYear must be a valid integer');
    }
  }

  if (hasEndYear) {
    parsedEndYear = parseInt(endYear, 10);
    if (Number.isNaN(parsedEndYear)) {
      throw newError(RESPONSE_TYPES.BAD_REQUEST, 'endYear must be a valid integer');
    }
  }

  if (parsedStartYear !== undefined && parsedEndYear !== undefined && parsedStartYear > parsedEndYear) {
    throw newError(RESPONSE_TYPES.BAD_REQUEST, 'startYear cannot be greater than endYear');
  }

  const query = ModelName.find();

  if (parsedStartYear !== undefined) {
    query.find({ year: { $gte: parsedStartYear } });
  }
  if (parsedEndYear !== undefined) {
    query.find({ year: { $lte: parsedEndYear } });
  }
  if (state) query.find({ state });
  if (county) query.find({ county });
  if (rangerDistrict) query.find({ rangerDistrict });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

  const cursor = query
    .sort(ModelName.schema.indexes()[0][0])
    .lean()
    .cursor();

  const stringifier = stringify({
    header: true,
    columns: fields,
  });

  return new Promise((resolve, reject) => {
    // Clean up resources on ANY error
    const cleanup = () => {
      if (!cursor.closed) cursor.close();
    };

    cursor.on('data', (doc) => {
      stringifier.write(doc);
    });

    cursor.on('error', (err) => {
      stringifier.end();
      reject(err);
    });

    cursor.on('end', () => {
      stringifier.end();
    });

    stringifier.on('error', (err) => {
      cleanup(); // ← this ensures that cursor doesn't continue and DB connection can be closed when ie there were some malformed data causing stringifier error
      reject(err);
    });

    stringifier.on('end', () => {
      cleanup(); // Good practice
      resolve();
    });

    // Handle client disconnect (ie use cancels download)
    res.on('close', () => {
      cleanup();
      reject(new Error('Client disconnected'));
    });

    stringifier.pipe(res);
  });
};
