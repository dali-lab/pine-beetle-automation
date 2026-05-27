import * as rModel from './r-model';

import {
  SummarizedCountyModel,
  UnsummarizedTrappingModel,
} from '../models';

import { RESPONSE_TYPES, COLLECTION_NAMES, DEFAULT_MODEL_VERSION } from '../constants';

import {
  calculatedFieldsGeneratorCreator,
  csvDownloadCreator,
  csvStreamDownloadCreator,
  extractObjectFieldsCreator,
  getModelAttributes,
  getModelIndexes,
  getModelNumericAttributes,
  indicatorGeneratorCreator,
  newError,
  offsetYearPassCreator,
  predictionGeneratorCreator,
  processCSV,
  processCSVAsync,
  trappingAggregationPipelineCreator,
  tryCastNumber,
  upsertOpCreator,
  validateNumberEntry,
} from '../utils';

const modelAttributes = getModelAttributes(SummarizedCountyModel);
const numericModelAttributes = getModelNumericAttributes(SummarizedCountyModel);
const spotAttributes = ['state', 'county', 'year', 'spotst0'];
const downloadFieldsToOmit = ['cleridPerDay', 'spbPerDay'];
const downloadFieldsPrediction = ['state', 'county', 'year', 'mu', 'pi', 'spotst0', 'expSpotsIfOutbreak', 'probSpotsGT0', 'probSpotsGT20', 'probSpotsGT50', 'probSpotsGT150', 'probSpotsGT400', 'probSpotsGT1000'];

/**
 * @description checks that any provided object contains all the model attributes, and filters out any other values
 * @param {Object} obj an object to check
 * @returns {Object|false} the filtered object containing only the model attributes if the provided object contains them, else false
 */
const extractModelAttributes = extractObjectFieldsCreator(modelAttributes);

// generic upsert operator for this model
const upsertOp = upsertOpCreator(getModelIndexes(SummarizedCountyModel));

/**
 * @description Fetches one year's data from the summarized county collection.
 * @param {String} id ID of the document wanted
 * @returns {Promise<SummarizedCountyModel>} the document in question
 * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
 */
export const getById = async (id) => {
  const doc = await SummarizedCountyModel.findById(id);
  if (!doc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return doc;
};

/**
 * @description Fetches all data from the summarized county collection with pagination.
 * @param {Number|String} [page] page number (1-indexed)
 * @param {Number|String} [limit] number of records per page
 * @returns {Promise<Array|{data: Array, pagination: Object}>} array if no pagination params, otherwise paginated results
 */
export const getAll = async (page, limit) => {
  const hasPagination = page !== undefined || limit !== undefined;
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(5000, Math.max(1, parseInt(limit, 10) || 1000)); // max 5000 per page

  const skip = (parsedPage - 1) * parsedLimit;
  const total = await SummarizedCountyModel.countDocuments();

  const data = await SummarizedCountyModel.find()
    .sort({
      year: 1,
      state: 1,
      county: 1,
      endobrev: 1,
    })
    .skip(skip)
    .limit(parsedLimit)
    .lean()
    .exec();

  // Return just the array for backward compatibility when no pagination params are provided
  if (!hasPagination) {
    return data;
  }

  return {
    data,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

/**
 * Fetches summarized county trapping data depending on a filter with pagination.
 * @param {Number|String} startYear the earliest year to return, inclusive
 * @param {Number|String} endYear the latest year to return, inclusive
 * @param {String} state the state to return
 * @param {String} county the county to return
 * @param {Number|String} [page] page number (1-indexed)
 * @param {Number|String} [limit] number of records per page
 * @returns {Promise<Array|{data: Array, pagination: Object}>} array if no pagination params, otherwise paginated results
 */
export const getByFilter = async (startYear, endYear, state, county, page, limit) => {
  const query = SummarizedCountyModel.find();

  if (startYear) {
    const parsedStartYear = parseInt(startYear, 10);
    if (!Number.isNaN(parsedStartYear)) {
      query.find({ year: { $gte: parsedStartYear } });
    }
  }
  if (endYear) {
    const parsedEndYear = parseInt(endYear, 10);
    if (!Number.isNaN(parsedEndYear)) {
      query.find({ year: { $lte: parsedEndYear } });
    }
  }
  if (state) query.find({ state });
  if (county) query.find({ county });

  const hasPagination = page !== undefined || limit !== undefined;
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(5000, Math.max(1, parseInt(limit, 10) || 1000)); // max 5000 per page

  const skip = (parsedPage - 1) * parsedLimit;
  const total = await query.model.countDocuments(query.getFilter());

  const data = await query
    .sort({
      year: 1,
      state: 1,
      county: 1,
      endobrev: 1,
    })
    .skip(skip)
    .limit(parsedLimit)
    .lean()
    .exec();

  // Return just the array for backward compatibility when no pagination params are provided
  if (!hasPagination) {
    return data;
  }

  return {
    data,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

/**
 * @description Inserts one year's data into the summarized county collection.
 * @param {Object} body request body to be cleaned and added
 * @returns {Promise<SummarizedCountyModel>}
 * @throws RESPONSE_TYPES.BAD_REQUEST if missing input
 */
export const insertOne = async (body) => {
  const cleanedBody = extractModelAttributes(body);

  const newDoc = new SummarizedCountyModel(cleanedBody);
  return newDoc.save();
};

/**
 * @description Updates one year's data in the summarized county collection.
 * @param {String} id ID of the document to update
 * @param {Object} body request body to be cleaned and added
 * @returns {Promise<SummarizedCountyModel>} updated doc
 * @throws RESPONSE_TYPES.BAD_REQUEST if missing input
 * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
 */
export const updateById = async (id, body) => {
  const updatedDoc = await SummarizedCountyModel.findByIdAndUpdate(id, body, {
    new: true,
    omitUndefined: true,
  });
  if (!updatedDoc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return updatedDoc;
};

/**
 * @description Deletes one year's data in the summarized county collection.
 * @param {String} id ID of the document to delete
 * @returns {Promise<SummarizedCountyModel>} deleted doc
 * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
 */
export const deleteById = async (id) => {
  const deletedDoc = await SummarizedCountyModel.findByIdAndDelete(id);
  if (!deletedDoc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return deletedDoc;
};

/**
 * @description Deletes all data in the collection
 * @param {Object={}} [options] optional options object
 * @returns {Promise}
 */
export const deleteAll = async (options = {}) => {
  return SummarizedCountyModel.deleteMany(options);
};

/**
 * @description downloads a csv of the entire collection
 * @throws RESPONSE_TYPES.INTERNAL_ERROR for problem parsing CSV
 * @returns {String} path to CSV file
 */
export const downloadCsv = csvDownloadCreator(
  SummarizedCountyModel,
  modelAttributes.filter((a) => !downloadFieldsToOmit.includes(a)),
);

/**
 * @description downloads a csv of the collection via streaming (memory-efficient)
 * Supports all data if no year filters provided
 * @param {Object} filters query filters
 * @param {Object} res Express response object
 * @throws RESPONSE_TYPES.INTERNAL_ERROR for problem parsing CSV
 * @throws RESPONSE_TYPES.BAD_REQUEST for invalid parameters
 */
export const downloadCsvStream = csvStreamDownloadCreator(
  SummarizedCountyModel,
  modelAttributes.filter((a) => !downloadFieldsToOmit.includes(a)),
  'county-prediction.csv',
);

/**
 * @description downloads a csv of the columns relevant to predictions
 * @throws RESPONSE_TYPES.INTERNAL_ERROR for problem parsing CSV
 * @returns {String} path to CSV file
 */
export const downloadPredictionCsv = csvDownloadCreator(
  SummarizedCountyModel,
  modelAttributes.filter((a) => downloadFieldsPrediction.includes(a)),
);

/**
 * @description cleans row of CSV for entire model, casts undefined or empty string to null
 * @param {Object} row object representing a row of data for this model
 * @returns {Object} cleaned row
 */
const cleanCsv = (row) => {
  const cleanedNumericValues = numericModelAttributes.reduce((acc, curr) => ({
    ...acc,
    [curr]: validateNumberEntry(row[curr]),
  }), {});

  return {
    ...row,
    ...cleanedNumericValues,
    cleridPerDay: row.cleridPerDay ?? {},
    spbPerDay: row.spbPerDay ?? {},
  };
};

const buildCountyIdentifier = (row, rowNumber) => (
  `row ${rowNumber} / ${row.state || '?'} / ${row.county || '?'} / ${row.year || '?'}`
);

// pre-validate every numeric attribute the same way mongoose would at bulkWrite time
const collectNumericRejections = (row, identifier, rowNumber) => {
  const out = [];
  numericModelAttributes.forEach((field) => {
    const raw = row[field];
    if (raw === undefined || raw === null || raw === '') return;
    if (!tryCastNumber(raw).ok) {
      out.push({
        rowNumber,
        identifier,
        reason: 'INVALID_NUMERIC',
        field,
        value: String(raw),
      });
    }
  });
  return out;
};

/**
 * @description parses + validates the summarized-county CSV without writing to DB
 */
export const parseCountyCsv = async (filename) => {
  const rejected = [];

  const { docs, rowCount, rejections } = await processCSV(filename, (row, rowNumber) => {
    const cleanedData = extractModelAttributes(cleanCsv(row));
    const identifier = buildCountyIdentifier(row, rowNumber);

    // pre-validate cast-ability for every numeric field — surfaces what
    // would otherwise be a silent CastError at bulkWrite time
    const castIssues = collectNumericRejections(cleanedData, identifier, rowNumber);
    if (castIssues.length > 0) {
      rejected.push(...castIssues);
      return null;
    }

    return cleanedData;
  }, { collectErrors: true });

  rejections.forEach(({ rowNumber, error, raw }) => {
    rejected.push({
      rowNumber,
      identifier: buildCountyIdentifier(raw, rowNumber),
      reason: 'MISSING_REQUIRED_FIELD',
      field: error?.message || '',
    });
  });

  const validDocs = docs.filter((d) => !!d);
  const upsertOperations = validDocs.map(upsertOp);

  return {
    rowCount,
    upsertOperations,
    accepted: validDocs.length,
    skipped: [],
    rejected,
  };
};

/**
 * @description uploads a csv to the summarized county collection
 * @param {String} filename the csv filename on disk
 * @param {Object} [options]
 * @param {Boolean} [options.dryRun=false]
 * @throws RESPONSE_TYPES.BAD_REQUEST for missing fields
 * @throws other errors depending on what went wrong
 */
export const uploadCsv = async (filename, options = {}) => {
  const { dryRun = false } = options;
  const parsed = await parseCountyCsv(filename);

  if (dryRun) {
    return {
      rowCount: parsed.rowCount,
      accepted: parsed.accepted,
      skippedRows: 0,
      rejectedRows: parsed.rejected.length,
      skipped: [],
      rejected: parsed.rejected,
      bulkWriteResult: null,
    };
  }

  const bulkWriteResult = parsed.upsertOperations.length
    ? await SummarizedCountyModel.bulkWrite(parsed.upsertOperations)
    : null;

  console.log(`successfully parsed ${parsed.rowCount} rows from csv upload`);

  return {
    rowCount: parsed.rowCount,
    accepted: parsed.accepted,
    skippedRows: 0,
    rejectedRows: parsed.rejected.length,
    skipped: [],
    rejected: parsed.rejected,
    bulkWriteResult,
  };
};

/**
 * @description cleans row of CSV for spot upload, casts undefined or empty string to null
 * @param {Object} row object representing a row of data for this model
 * @returns {Object} cleaned row
 */
const cleanSpotsCsv = (row) => {
  const {
    county,
    spotst0,
    state,
    year,
  } = row;

  return {
    county,
    spotst0: validateNumberEntry(spotst0),
    state,
    year,
  };
};

/**
 * @description parses + validates the spots CSV without writing to DB
 */
export const parseCountySpotsCsv = async (filename) => {
  const rejected = [];

  const { docs, rowCount, rejections } = await processCSVAsync(filename, async (row, rowNumber) => {
    const cleanedData = extractObjectFieldsCreator(spotAttributes)(cleanSpotsCsv(row));
    const identifier = buildCountyIdentifier(row, rowNumber);

    // validate spotst0 + year cast — these are the only numerics here
    if (!tryCastNumber(cleanedData.spotst0).ok) {
      rejected.push({
        rowNumber, identifier, reason: 'INVALID_NUMERIC', field: 'spotst0', value: String(cleanedData.spotst0),
      });
      return null;
    }
    if (cleanedData.year !== undefined && cleanedData.year !== '' && !tryCastNumber(cleanedData.year).ok) {
      rejected.push({
        rowNumber, identifier, reason: 'INVALID_NUMERIC', field: 'year', value: String(cleanedData.year),
      });
      return null;
    }

    const { county, state, year } = cleanedData;

    const matchingDoc = await SummarizedCountyModel.findOne({ state, year, county });
    const endobrev = matchingDoc?.endobrev || null;

    return { ...cleanedData, endobrev };
  }, { collectErrors: true });

  rejections.forEach(({ rowNumber, error, raw }) => {
    rejected.push({
      rowNumber,
      identifier: buildCountyIdentifier(raw, rowNumber),
      reason: 'MISSING_REQUIRED_FIELD',
      field: error?.message || '',
    });
  });

  const validDocs = docs.filter((d) => !!d);
  const upsertOperations = validDocs.map(upsertOp);

  return {
    rowCount,
    upsertOperations,
    accepted: validDocs.length,
    skipped: [],
    rejected,
  };
};

/**
 * @description uploads a csv with spot data to the summarized county collection
 * @param {String} filename the csv filename on disk
 * @param {Object} [options]
 * @param {Boolean} [options.dryRun=false]
 * @throws RESPONSE_TYPES.BAD_REQUEST for missing fields
 * @throws other errors depending on what went wrong
 */
export const uploadSpotsCsv = async (filename, options = {}) => {
  const { dryRun = false } = options;
  const parsed = await parseCountySpotsCsv(filename);

  if (dryRun) {
    return {
      rowCount: parsed.rowCount,
      accepted: parsed.accepted,
      skippedRows: 0,
      rejectedRows: parsed.rejected.length,
      skipped: [],
      rejected: parsed.rejected,
      bulkWriteResult: null,
    };
  }

  const bulkWriteResult = parsed.upsertOperations.length
    ? await SummarizedCountyModel.bulkWrite(parsed.upsertOperations)
    : null;

  console.log(`successfully parsed ${parsed.rowCount} rows from csv upload`);

  return {
    rowCount: parsed.rowCount,
    accepted: parsed.accepted,
    skippedRows: 0,
    rejectedRows: parsed.rejected.length,
    skipped: [],
    rejected: parsed.rejected,
    bulkWriteResult,
  };
};

/**
 * @description Clears the SPB value for all documents matching filter. This helps ensure data validity during survey deletions.
 * @param {Object} filter mongo query filter for subsetting data
 */
export const clearAll = async (filter) => {
  return SummarizedCountyModel.updateMany(filter, { spbPer2Weeks: null });
};

/**
 * @description Summarizes all trapping data at the county level. Will overwrite all entries in this collection.
 * @param {Object} filter mongo query filter for subsetting data
 */
export const summarizeAll = async (filter) => {
  return UnsummarizedTrappingModel.aggregate([
    ...trappingAggregationPipelineCreator('county', COLLECTION_NAMES.SUMMARIZED_COUNTY, filter),
  ]).exec();
};

/**
 * @description cycles through year-2 data to set spotst2
 * @param {Object} filter mongo query filter for subsetting data
 */
export const yearT2Pass = async (filter) => {
  // running two pipelines split on endobrev value to accomodate the db collection index
  // data from 2021 onwards will not have split endobrev values for a state/year/county
  // therefore, we need to run these separately to accomodate the db index, but it makes no difference in the data outcome

  const endoPipeline = SummarizedCountyModel.aggregate([
    ...offsetYearPassCreator('t2')('county', COLLECTION_NAMES.SUMMARIZED_COUNTY, filter, 1),
  ]).exec();

  const noEndoPipeline = SummarizedCountyModel.aggregate([
    ...offsetYearPassCreator('t2')('county', COLLECTION_NAMES.SUMMARIZED_COUNTY, filter, 0),
  ]).exec();

  return Promise.all([endoPipeline, noEndoPipeline]);
};

/**
 * @description cycles through year-1 data to set spotst1 & cleridst1
 * @param {Object} filter mongo query filter for subsetting data
 */
export const yearT1Pass = (filter) => {
  // running two pipelines split on endobrev value to accomodate the db collection index
  // data from 2021 onwards will not have split endobrev values for a state/year/county
  // therefore, we need to run these separately to accomodate the db index, but it makes no difference in the data outcome

  const endoPipeline = SummarizedCountyModel.aggregate([
    ...offsetYearPassCreator('t1')('county', COLLECTION_NAMES.SUMMARIZED_COUNTY, filter, 1),
  ]).exec();

  const noEndoPipeline = SummarizedCountyModel.aggregate([
    ...offsetYearPassCreator('t1')('county', COLLECTION_NAMES.SUMMARIZED_COUNTY, filter, 0),
  ]).exec();

  return Promise.all([endoPipeline, noEndoPipeline]);
};

/**
 * @description function for setting indicator variables in model
 * @returns {(filter: Object) => Promise} async function receiving filter for data subsetting
 */
export const indicatorPass = indicatorGeneratorCreator('county', SummarizedCountyModel, upsertOp);

/**
   * @description generates all predictions for the county level data
   * @returns {(filter: Object) => Promise} async function receiving filter for data subsetting
   */
export const generateAllPredictions = predictionGeneratorCreator('county', rModel.runModel, SummarizedCountyModel, upsertOp, DEFAULT_MODEL_VERSION);

/**
   * @description generates all calculated fields for the county level data
   * @returns {(filter: Object) => Promise} async function receiving filter for data subsetting
   */
export const generateAllCalculatedFields = calculatedFieldsGeneratorCreator('county', rModel.generateCalculatedFields, SummarizedCountyModel, upsertOp);

/**
 * @description deletes all rows where neither trapping nor spot data exists
 * @param {Object} filter mongo query filter for subsetting data
 */
export const deleteStaleRows = async (filter) => {
  return SummarizedCountyModel.deleteMany({ ...filter, hasSPBTrapping: 0, hasSpotst0: 0 });
};
