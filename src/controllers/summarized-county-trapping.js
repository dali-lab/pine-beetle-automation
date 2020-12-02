import {
  SummarizedCountyTrappingModel,
  UnsummarizedTrappingModel,
} from '../models';

import { RESPONSE_TYPES } from '../constants';

import {
  aggregationPipelineCreator,
  cleanBodyCreator,
  csvDownloadCreator,
  csvUploadCreator,
  getIndexes,
  getModelAttributes,
  matchStateYear,
  newError,
  upsertOpCreator,
} from '../utils';

const modelAttributes = getModelAttributes(SummarizedCountyTrappingModel);

// this is a function to clean req.body
const cleanBody = cleanBodyCreator(modelAttributes);

const upsertOp = upsertOpCreator(getIndexes(SummarizedCountyTrappingModel));

// function for cleaning row of csv (will cast undefined to null for specified fields)
const cleanCsv = (row) => ({
  ...row,
  cleridCount: row.cleridCount ?? null,
  cleridPerDay: row.cleridPerDay ?? {},
  spbCount: row.spbCount ?? null,
  spbPerDay: row.spbPerDay ?? {},
  spots: null,
  spotst1: null,
  spotst2: null,
  totalTrappingDays: row.totalTrappingDays ?? null,
  trapCount: row.trapCount ?? null,
});

/**
 * @description uploads a csv to the summarized county collection
 * @param {String} filename the csv filename on disk
 * @throws RESPONSE_TYPES.BAD_REQUEST for missing fields
 * @throws other errors depending on what went wrong
 */
export const uploadCsv = csvUploadCreator(
  SummarizedCountyTrappingModel,
  cleanCsv,
  cleanBody,
  undefined,
  undefined,
  upsertOp,
);

/**
 * @description downloads a csv of the entire collection
 * @throws RESPONSE_TYPES.INTERNAL_ERROR for problem parsing CSV
 * @returns {String} path to CSV file
 */
export const downloadCsv = csvDownloadCreator(SummarizedCountyTrappingModel, modelAttributes);

/**
 * @description Fetches one year's data from the summarized county collection.
 * @param {String} id ID of the document wanted
 * @returns {Promise<SummarizedCountyTrappingModel>} the document in question
 * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
 */
export const getById = async (id) => {
  const doc = await SummarizedCountyTrappingModel.findById(id);
  if (!doc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return doc;
};

/**
 * @description Fetches all data from the summarized county collection.
 * @returns {Promise<[SummarizedCountyTrappingModel]>} all docs
 */
export const getAll = async () => {
  return SummarizedCountyTrappingModel.find();
};

/**
 * @description Inserts one year's data into the summarized county collection.
 * @param {Object} body request body to be cleaned and added
 * @returns {Promise<SummarizedCountyTrappingModel>}
 * @throws RESPONSE_TYPES.BAD_REQUEST if missing input
 */
export const insertOne = async (body) => {
  const cleanedBody = cleanBody(body);
  if (!cleanedBody) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'missing parameter(s) in request body');

  const newDoc = new SummarizedCountyTrappingModel(cleanedBody);
  return newDoc.save();
};

/**
 * @description Updates one year's data in the summarized county collection.
 * @param {String} id ID of the document to update
 * @param {Object} body request body to be cleaned and added
 * @returns {Promise<SummarizedCountyTrappingModel>} updated doc
 * @throws RESPONSE_TYPES.BAD_REQUEST if missing input
 * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
 */
export const updateById = async (id, body) => {
  const cleanedBody = cleanBody(body);
  if (!cleanedBody) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'missing parameter(s) in request body');

  const updatedDoc = await SummarizedCountyTrappingModel.findByIdAndUpdate(id, cleanBody, {
    new: true,
    omitUndefined: true,
  });
  if (!updatedDoc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return updatedDoc;
};

/**
 * @description Deletes one year's data in the summarized county collection.
 * @param {String} id ID of the document to delete
 * @returns {Promise<SummarizedCountyTrappingModel>} deleted doc
 * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
 */
export const deleteById = async (id) => {
  const deletedDoc = await SummarizedCountyTrappingModel.findByIdAndDelete(id);
  if (!deletedDoc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return deletedDoc;
};

/**
 * @description Deletes all data in the collection
 * @param {Object={}} [options] optional options object
 * @returns {Promise}
 */
export const deleteAll = async (options = {}) => {
  return SummarizedCountyTrappingModel.deleteMany(options);
};

/**
 * @description Deletes all data in the collection
 * @param {String} state state name
 * @param {Number} year year
 * @returns {Promise}
 */
export const deleteStateYear = async (state, year) => {
  if (state === 2018) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'Cannot delete 2018 data');
  return SummarizedCountyTrappingModel.deleteMany({ state, year });
};

/**
 * @description Summarizes all trapping data at the county level. Will overwrite all entries in this collection.
 */
export const summarizeAll = async () => {
  return UnsummarizedTrappingModel.aggregate([
    ...aggregationPipelineCreator('county', 'summarizedcountytrappings'),
  ]).exec();
};

/**
 * @description Summarizes all trapping data at the county level for a given state and year.
 * Should be triggered by Survey123 data indicating a state has finished collection for a year.
 * @param {String} state the state to summarize
 * @param {Number} year the year to summarize
 */
export const summarizeStateYear = async (state, year) => {
  return UnsummarizedTrappingModel.aggregate([
    ...matchStateYear(state, year),
    ...aggregationPipelineCreator('county', 'summarizedcountytrappings'),
  ]).exec();
};

/**
 * Fetches summarized county trapping data depending on a filter.
 * @param {Number} startYear the earliest year to return, inclusive
 * @param {Number} endYear the latest year to return, inclusive
 * @param {String} state the state to return
 * @param {String} county the county to return
 */
export const getByFilter = async (startYear, endYear, state, county) => {
  const query = SummarizedCountyTrappingModel.find();

  if (startYear) query.find({ year: { $gte: startYear } });
  if (endYear) query.find({ year: { $lte: endYear } });
  if (state) query.find({ state });
  if (county) query.find({ county });

  return query.exec();
};
