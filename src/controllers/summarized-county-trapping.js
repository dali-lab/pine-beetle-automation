import { SummarizedCountyTrappingModel } from '../models';

import {
  RESPONSE_TYPES,
  newError,
} from '../constants';

/**
 * @param {Object} reqbody the proposed document to check from req.body
 * @returns true if body is valid, false otherwise
 */
const checkBody = (reqbody) => {
  const params = [
    'cleridCount',
    'county',
    'spbCount',
    'state',
    'year',
  ];
  return params.reduce((hasAllKeys, key) => {
    return hasAllKeys && Object.keys(reqbody).includes(key);
  }, true);
};

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
 * @param doc SummarizedCountyTrappingModel document
 * @returns {Promise<SummarizedCountyTrappingModel>}
 * @throws RESPONSE_TYPES.BAD_REQUEST if missing input
 */
export const insertOne = async (doc) => {
  if (!checkBody(doc)) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'missing parameter(s) in request body');

  const {
    cleridCount,
    county,
    spbCount,
    state,
    year,
  } = doc;
  const newDoc = new SummarizedCountyTrappingModel({
    cleridCount,
    county,
    spbCount,
    state,
    year,
  });
  return newDoc.save();
};

/**
 * @description Updates one year's data in the summarized county collection.
 * @param {String} id ID of the document to update
 * @param doc SummarizedCountyTrappingModel document
 * @returns {Promise<SummarizedCountyTrappingModel>} updated doc
 * @throws RESPONSE_TYPES.BAD_REQUEST if missing input
 * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
 */
export const updateById = async (id, doc) => {
  if (!checkBody(doc)) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'missing parameter(s) in request body');

  const {
    cleridCount,
    county,
    spbCount,
    state,
    year,
  } = doc;
  const updatedDoc = await SummarizedCountyTrappingModel.findByIdAndUpdate(id, {
    cleridCount,
    county,
    spbCount,
    state,
    year,
  }, {
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
 * @description Summarizes all trapping data at the county level. Will overwrite all entries in this collection.
 */
export const summarizeAll = async () => {
  // return 'hello this is TBD';
};

/**
 * @description Summarizes all trapping data at the county level for a given state and year.
 * Should be triggered by Survey123 data indicating a state has finished collection for a year.
 * @param {String} state the state to summarize
 * @param {Number} year the year to summarize
 */
export const summarizeStateYear = async (state, year) => {
  // return 'hello this is TBD';
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
