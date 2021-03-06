import compose from 'compose-function';

import {
  SummarizedRangerDistrictTrappingModel,
  UnsummarizedTrappingModel,
} from '../models';

import {
  RESPONSE_TYPES,
  STATE_RANGER_DISTRICT_NAME_MAPPING,
} from '../constants';

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

const modelAttributes = getModelAttributes(SummarizedRangerDistrictTrappingModel);

// this is a function to clean req.body
const cleanBody = cleanBodyCreator(modelAttributes);

const upsertOp = upsertOpCreator(getIndexes(SummarizedRangerDistrictTrappingModel));

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

// transform ranger district name
const rangerDistrictNameTransform = (row) => ({
  ...row,
  rangerDistrict: STATE_RANGER_DISTRICT_NAME_MAPPING[row.state]?.[row.rangerDistrict],
});

const nullTransform = (doc) => ({
  ...doc,
  cleridPer2Weeks: doc.cleridPer2Weeks !== '' ? doc.cleridPer2Weeks : null,
  spbPer2Weeks: doc.spbPer2Weeks !== '' ? doc.spbPer2Weeks : null,
});

const rdAndNullTransform = compose(rangerDistrictNameTransform, nullTransform);

/**
 * @description uploads a csv to the summarized ranger district collection
 * @param {String} filename the csv filename on disk
 * @throws RESPONSE_TYPES.BAD_REQUEST for missing fields
 * @throws other errors depending on what went wrong
 */
export const uploadCsv = csvUploadCreator(
  SummarizedRangerDistrictTrappingModel,
  cleanCsv,
  cleanBody,
  undefined,
  rdAndNullTransform,
  upsertOp,
);

const downloadFieldsToOmit = ['cleridCount', 'cleridPerDay', 'spbCount', 'spbPerDay'];

/**
 * @description downloads a csv of the entire collection
 * @throws RESPONSE_TYPES.INTERNAL_ERROR for problem parsing CSV
 * @returns {String} path to CSV file
 */
export const downloadCsv = csvDownloadCreator(
  SummarizedRangerDistrictTrappingModel,
  modelAttributes.filter((a) => !downloadFieldsToOmit.includes(a)),
);

/**
 * @description Fetches one year's data from the summarized ranger district collection.
 * @param {String} id ID of the document wanted
 * @returns {Promise<SummarizedRangerDistrictTrappingModel>} the document in question
 * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
 */
export const getById = async (id) => {
  const doc = await SummarizedRangerDistrictTrappingModel.findById(id);
  if (!doc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return doc;
};

/**
 * @description Fetches all data from the summarized ranger district collection.
 * @returns {Promise<[SummarizedRangerDistrictTrappingModel]>} all docs
 */
export const getAll = async () => {
  return SummarizedRangerDistrictTrappingModel.find();
};

/**
 * @description Inserts one year's data into the summarized ranger district collection.
 * @param {Object} body request body to be cleaned and added
 * @returns {Promise<SummarizedRangerDistrictTrappingModel>}
 * @throws RESPONSE_TYPES.BAD_REQUEST if missing input
 */
export const insertOne = async (body) => {
  const cleanedBody = cleanBody(body);
  if (!cleanedBody) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'missing parameter(s) in request body');

  const newDoc = new SummarizedRangerDistrictTrappingModel(cleanedBody);
  return newDoc.save();
};

/**
 * @description Updates one year's data in the summarized ranger district collection.
 * @param {String} id ID of the document to update
 * @param {Object} body request body to be cleaned and added
 * @returns {Promise<SummarizedRangerDistrictTrappingModel>} updated doc
 * @throws RESPONSE_TYPES.BAD_REQUEST if missing input
 * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
 */
export const updateById = async (id, body) => {
  const cleanedBody = cleanBody(body);
  if (!cleanedBody) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'missing parameter(s) in request body');

  const updatedDoc = await SummarizedRangerDistrictTrappingModel.findByIdAndUpdate(id, cleanBody, {
    new: true,
    omitUndefined: true,
  });
  if (!updatedDoc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return updatedDoc;
};

/**
 * @description Deletes one year's data in the summarized ranger district collection.
 * @param {String} id ID of the document to delete
 * @returns {Promise<SummarizedRangerDistrictTrappingModel>} deleted doc
 * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
 */
export const deleteById = async (id) => {
  const deletedDoc = await SummarizedRangerDistrictTrappingModel.findByIdAndDelete(id);
  if (!deletedDoc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return deletedDoc;
};

/**
 * @description Deletes all data in the collection
 * @param {Object={}} [options] optional options object
 * @returns {Promise}
 */
export const deleteAll = async (options = {}) => {
  return SummarizedRangerDistrictTrappingModel.deleteMany(options);
};

/**
 * @description Deletes all data in the collection
 * @param {String} state state name
 * @param {Number} year year
 * @returns {Promise}
 */
export const deleteStateYear = async (state, year) => {
  if (state === 2018) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'Cannot delete 2018 data');
  return SummarizedRangerDistrictTrappingModel.deleteMany({ state, year });
};

/**
 * @description Summarizes all trapping data at the ranger district level. Will overwrite all entries in this collection.
 */
export const summarizeAll = async () => {
  return UnsummarizedTrappingModel.aggregate([
    ...aggregationPipelineCreator('rangerDistrict', 'summarizedrangerdistricttrappings'),
  ]).exec();
};

/**
 * @description Summarizes all trapping data at the ranger district level for a given state and year.
 * Should be triggered by Survey123 data indicating a state has finished collection for a year.
 * @param {String} state the state to summarize
 * @param {Number} year the year to summarize
 */
export const summarizeStateYear = async (state, year) => {
  return UnsummarizedTrappingModel.aggregate([
    ...matchStateYear(state, year),
    ...aggregationPipelineCreator('rangerDistrict', 'summarizedrangerdistricttrappings'),
  ]).exec();
};

/**
 * Fetches summarized ranger district trapping data depending on a filter.
 * @param {Number} startYear the earliest year to return, inclusive
 * @param {Number} endYear the latest year to return, inclusive
 * @param {String} state the state to return
 * @param {String} ranger district the county to return
 */
export const getByFilter = async (startYear, endYear, state, rangerDistrict) => {
  const query = SummarizedRangerDistrictTrappingModel.find();

  if (startYear) query.find({ year: { $gte: startYear } });
  if (endYear) query.find({ year: { $lte: endYear } });
  if (state) query.find({ state });
  if (rangerDistrict) query.find({ rangerDistrict });

  return query.exec();
};
