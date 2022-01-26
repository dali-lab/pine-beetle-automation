import {
  SummarizedCountyModel,
  UnsummarizedTrappingModel,
} from '../models';

import { RESPONSE_TYPES } from '../constants';

import {
  trappingAggregationPipelineCreator,
  cleanBodyCreator,
  csvDownloadCreator,
  csvUploadCreator,
  getIndexes,
  getModelAttributes,
  getModelNumericAttributes,
  // matchStateYear,
  newError,
  upsertOpCreator,
  validateNumberEntry,
} from '../utils';

const modelAttributes = getModelAttributes(SummarizedCountyModel);
const numericModelAttributes = getModelNumericAttributes(SummarizedCountyModel);

// this is a function to clean req.body
const cleanBody = cleanBodyCreator(modelAttributes);

const upsertOp = upsertOpCreator(getIndexes(SummarizedCountyModel));

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
 * @description uploads a csv to the summarized county collection
 * @param {String} filename the csv filename on disk
 * @throws RESPONSE_TYPES.BAD_REQUEST for missing fields
 * @throws other errors depending on what went wrong
 */
export const uploadCsv = csvUploadCreator(
  SummarizedCountyModel,
  cleanCsv,
  cleanBody,
  undefined,
  undefined,
  upsertOp,
);

const downloadFieldsToOmit = ['cleridPerDay', 'spbPerDay'];

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
 * @description Fetches all data from the summarized county collection.
 * @returns {Promise<[SummarizedCountyModel]>} all docs
 */
export const getAll = async () => {
  return SummarizedCountyModel.find();
};

/**
 * @description Inserts one year's data into the summarized county collection.
 * @param {Object} body request body to be cleaned and added
 * @returns {Promise<SummarizedCountyModel>}
 * @throws RESPONSE_TYPES.BAD_REQUEST if missing input
 */
export const insertOne = async (body) => {
  const cleanedBody = cleanBody(body);
  if (!cleanedBody) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'missing parameter(s) in request body');

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
  const cleanedBody = cleanBody(body);
  if (!cleanedBody) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'missing parameter(s) in request body');

  const updatedDoc = await SummarizedCountyModel.findByIdAndUpdate(id, cleanBody, {
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
 * @description Deletes all data in the collection
 * @param {String} state state name
 * @param {Number} year year
 * @returns {Promise}
 */
export const deleteStateYear = async (state, year) => {
  if (state === 2018) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'Cannot delete 2018 data');
  return SummarizedCountyModel.deleteMany({ state, year });
};

/**
 * @description Summarizes all trapping data at the county level. Will overwrite all entries in this collection.
 * @param {Object} filter mongo query filter for subsetting data
 */
export const summarizeAll = async (filter) => {
  return UnsummarizedTrappingModel.aggregate([
    ...trappingAggregationPipelineCreator('county', 'summarizedcounties', filter),
  ]).exec();
};

/**
 * @description Summarizes all trapping data at the county level for a given state and year.
 * Should be triggered by Survey123 data indicating a state has finished collection for a year.
 * @param {String} state the state to summarize
 * @param {Number} year the year to summarize
 */
export const summarizeStateYear = async (state, year) => {
  // return UnsummarizedTrappingModel.aggregate([
  //   ...matchStateYear(state, year),
  //   ...aggregationPipelineCreator('county', 'summarizedcountytrappings'),
  // ]).exec();
};

/**
 * Fetches summarized county trapping data depending on a filter.
 * @param {Number} startYear the earliest year to return, inclusive
 * @param {Number} endYear the latest year to return, inclusive
 * @param {String} state the state to return
 * @param {String} county the county to return
 */
export const getByFilter = async (startYear, endYear, state, county) => {
  const query = SummarizedCountyModel.find();

  if (startYear) query.find({ year: { $gte: startYear } });
  if (endYear) query.find({ year: { $lte: endYear } });
  if (state) query.find({ state });
  if (county) query.find({ county });

  return query.exec();
};
