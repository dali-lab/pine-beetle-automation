import * as rModel from './r-model';

import {
  SummarizedRangerDistrictModel,
  UnsummarizedTrappingModel,
} from '../models';

import {
  RESPONSE_TYPES,
  COLLECTION_NAMES,
} from '../constants';

import {
  calculatedFieldsGeneratorCreator,
  csvDownloadCreator,
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
  upsertOpCreator,
  validateNumberEntry,
} from '../utils';

const modelAttributes = getModelAttributes(SummarizedRangerDistrictModel);
const numericModelAttributes = getModelNumericAttributes(SummarizedRangerDistrictModel);
const spotAttributes = ['state', 'rangerDistrict', 'year', 'spotst0'];
const downloadFieldsToOmit = ['cleridPerDay', 'spbPerDay'];

/**
 * @description checks that any provided object contains all the model attributes, and filters out any other values
 * @param {Object} obj an object to check
 * @returns {Object|false} the filtered object containing only the model attributes if the provided object contains them, else false
 */
const extractModelAttributes = extractObjectFieldsCreator(modelAttributes);

// generic upsert operator for this model
const upsertOp = upsertOpCreator(getModelIndexes(SummarizedRangerDistrictModel));

/**
 * @description Fetches one year's data from the summarized ranger district collection.
 * @param {String} id ID of the document wanted
 * @returns {Promise<SummarizedRangerDistrictModel>} the document in question
 * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
 */
export const getById = async (id) => {
  const doc = await SummarizedRangerDistrictModel.findById(id);
  if (!doc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return doc;
};

/**
 * @description Fetches all data from the summarized ranger district collection.
 * @returns {Promise<[SummarizedRangerDistrictModel]>} all docs
 */
export const getAll = async () => {
  return SummarizedRangerDistrictModel.find();
};

/**
 * Fetches summarized ranger district trapping data depending on a filter.
 * @param {Number} startYear the earliest year to return, inclusive
 * @param {Number} endYear the latest year to return, inclusive
 * @param {String} state the state to return
 * @param {String} ranger district the county to return
 */
export const getByFilter = async (startYear, endYear, state, rangerDistrict) => {
  const query = SummarizedRangerDistrictModel.find();

  if (startYear) query.find({ year: { $gte: startYear } });
  if (endYear) query.find({ year: { $lte: endYear } });
  if (state) query.find({ state });
  if (rangerDistrict) query.find({ rangerDistrict });

  return query.exec();
};

/**
 * @description Inserts one year's data into the summarized ranger district collection.
 * @param {Object} body request body to be cleaned and added
 * @returns {Promise<SummarizedRangerDistrictModel>}
 * @throws RESPONSE_TYPES.BAD_REQUEST if missing input
 */
export const insertOne = async (body) => {
  const cleanedBody = extractModelAttributes(body);
  if (!cleanedBody) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'missing parameter(s) in request body');

  const newDoc = new SummarizedRangerDistrictModel(cleanedBody);
  return newDoc.save();
};

/**
 * @description Updates one year's data in the summarized ranger district collection.
 * @param {String} id ID of the document to update
 * @param {Object} body request body to be cleaned and added
 * @returns {Promise<SummarizedRangerDistrictModel>} updated doc
 * @throws RESPONSE_TYPES.BAD_REQUEST if missing input
 * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
 */
export const updateById = async (id, body) => {
  const updatedDoc = await SummarizedRangerDistrictModel.findByIdAndUpdate(id, body, {
    new: true,
    omitUndefined: true,
  });
  if (!updatedDoc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return updatedDoc;
};

/**
 * @description Deletes one year's data in the summarized ranger district collection.
 * @param {String} id ID of the document to delete
 * @returns {Promise<SummarizedRangerDistrictModel>} deleted doc
 * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
 */
export const deleteById = async (id) => {
  const deletedDoc = await SummarizedRangerDistrictModel.findByIdAndDelete(id);
  if (!deletedDoc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return deletedDoc;
};

/**
 * @description Deletes all data in the collection
 * @param {Object={}} [options] optional options object
 * @returns {Promise}
 */
export const deleteAll = async (options = {}) => {
  return SummarizedRangerDistrictModel.deleteMany(options);
};

/**
 * @description downloads a csv of the entire collection
 * @throws RESPONSE_TYPES.INTERNAL_ERROR for problem parsing CSV
 * @returns {String} path to CSV file
 */
export const downloadCsv = csvDownloadCreator(
  SummarizedRangerDistrictModel,
  modelAttributes.filter((a) => !downloadFieldsToOmit.includes(a)),
);

// function for cleaning row of csv (will cast undefined or empty string to null for specified fields)
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

/**
 * @description uploads a csv to the summarized ranger district collection
 * @param {String} filename the csv filename on disk
 * @throws RESPONSE_TYPES.BAD_REQUEST for missing fields
 * @throws other errors depending on what went wrong
 */
export const uploadCsv = async (filename) => {
  const { docs, rowCount } = await processCSV(filename, (row) => {
    // cast the csv fields to our schema
    const cleanedData = extractModelAttributes(cleanCsv(row));
    if (!cleanedData) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'missing fields in csv');

    return cleanedData;
  });

  // apply another transformation to prepare for upserting
  const upsertOperations = docs.map(upsertOp);
  const bulkWriteResult = await SummarizedRangerDistrictModel.bulkWrite(upsertOperations);

  console.log(`successfully parsed ${rowCount} rows from csv upload`);
  return bulkWriteResult;
};

/**
 * @description cleans row of CSV for spot upload, casts undefined or empty string to null
 * @param {Object} row object representing a row of data for this model
 * @returns {Object} cleaned row
 */
const cleanSpotsCsv = (row) => {
  const {
    rangerDistrict,
    spotst0,
    state,
    year,
  } = row;

  return {
    rangerDistrict,
    spotst0: validateNumberEntry(spotst0),
    state,
    year,
  };
};

/**
 * @description uploads a csv with spot data to the summarized county collection
 * @param {String} filename the csv filename on disk
 * @throws RESPONSE_TYPES.BAD_REQUEST for missing fields
 * @throws other errors depending on what went wrong
 */
export const uploadSpotsCsv = async (filename) => {
  const { docs, rowCount } = await processCSVAsync(filename, async (row) => {
    // cast the csv fields to our schema
    const cleanedData = extractObjectFieldsCreator(spotAttributes)(cleanSpotsCsv(row));
    if (!cleanedData) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'missing fields in csv');

    // explicitly look up and set endobrev value for this document
    const { rangerDistrict, state, year } = cleanedData;

    const matchingDoc = await SummarizedRangerDistrictModel.findOne({ state, year, rangerDistrict });
    const endobrev = matchingDoc?.endobrev || null;

    return { ...cleanedData, endobrev };
  });

  // apply another transformation to prepare for upserting
  const upsertOperations = docs.map(upsertOp);
  const bulkWriteResult = await SummarizedRangerDistrictModel.bulkWrite(upsertOperations);

  console.log(`successfully parsed ${rowCount} rows from csv upload`);
  return bulkWriteResult;
};

/**
 * @description Clears the SPB value for all documents matching filter. This helps ensure data validity during survey deletions.
 * @param {Object} filter mongo query filter for subsetting data
 */
export const clearAll = async (filter) => {
  return SummarizedRangerDistrictModel.updateMany(filter, { spbPer2Weeks: null });
};

/**
 * @description Summarizes all trapping data at the ranger district level. Will overwrite all entries in this collection.
 * @param {Object} filter mongo query filter for subsetting data
 */
export const summarizeAll = async (filter) => {
  return UnsummarizedTrappingModel.aggregate([
    ...trappingAggregationPipelineCreator('rangerDistrict', COLLECTION_NAMES.SUMMARIZED_RANGERDISTRICT, filter),
  ]).exec();
};

/**
 * @description cycles through year-2 data to set spotst2
 * @param {Object} filter mongo query filter for subsetting data
 */
export const yearT2Pass = (filter) => {
  // running two pipelines split on endobrev value to accomodate the db collection index
  // data from 2021 onwards will not have split endobrev values for a state/year/rangerDistrict
  // therefore, we need to run these separately to accomodate the db index, but it makes no difference in the data outcome

  const endoPipeline = SummarizedRangerDistrictModel.aggregate([
    ...offsetYearPassCreator('t2')('rangerDistrict', COLLECTION_NAMES.SUMMARIZED_RANGERDISTRICT, filter, 1),
  ]).exec();

  const noEndoPipeline = SummarizedRangerDistrictModel.aggregate([
    ...offsetYearPassCreator('t2')('rangerDistrict', COLLECTION_NAMES.SUMMARIZED_RANGERDISTRICT, filter, 0),
  ]).exec();

  return Promise.all([endoPipeline, noEndoPipeline]);
};

/**
 * @description cycles through year-1 data to set spotst1 & cleridst1
 * @param {Object} filter mongo query filter for subsetting data
 */
export const yearT1Pass = (filter) => {
  // running two pipelines split on endobrev value to accomodate the db collection index
  // data from 2021 onwards will not have split endobrev values for a state/year/rangerDistrict
  // therefore, we need to run these separately to accomodate the db index, but it makes no difference in the data outcome

  const endoPipeline = SummarizedRangerDistrictModel.aggregate([
    ...offsetYearPassCreator('t1')('rangerDistrict', COLLECTION_NAMES.SUMMARIZED_RANGERDISTRICT, filter, 1),
  ]).exec();

  const noEndoPipeline = SummarizedRangerDistrictModel.aggregate([
    ...offsetYearPassCreator('t1')('rangerDistrict', COLLECTION_NAMES.SUMMARIZED_RANGERDISTRICT, filter, 0),
  ]).exec();

  return Promise.all([endoPipeline, noEndoPipeline]);
};

/**
 * @description function for setting indicator variables in model
 * @returns {(filter: Object) => Promise} async function receiving filter to generate indicators
 */
export const indicatorPass = indicatorGeneratorCreator('rangerDistrict', SummarizedRangerDistrictModel, upsertOp);

/**
   * @description generates all predictions for the county level data
   * @returns {(filter: Object) => Promise} async function receiving filter for data subsetting
   */
export const generateAllPredictions = predictionGeneratorCreator('rangerDistrict', rModel.runModel, SummarizedRangerDistrictModel, upsertOp);

/**
   * @description generates all calculated fields for the county level data
   * @returns {(filter: Object) => Promise} async function receiving filter for data subsetting
   */
export const generateAllCalculatedFields = calculatedFieldsGeneratorCreator('rangerDistrict', rModel.generateCalculatedFields, SummarizedRangerDistrictModel, upsertOp);

/**
 * @description deletes all rows where neither trapping nor spot data exists
 * @param {Object} filter mongo query filter for subsetting data
 */
export const deleteStaleRows = async (filter) => {
  return SummarizedRangerDistrictModel.deleteMany({ ...filter, hasSPBTrapping: 0, hasSpotst0: 0 });
};
