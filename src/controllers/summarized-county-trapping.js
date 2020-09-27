import { SummarizedCountyTrappingModel } from '../models';

/**
 * @description Fetches one week's data from the summarized county collection.
 * @param {String} id ID of the document wanted
 * @returns {Promise<SummarizedCountyTrappingModel>} the document in question
 */
export const getById = async (id) => {
  return SummarizedCountyTrappingModel.findById(id);
};

/**
 * @description Fetches all data from the summarized county collection.
 * @returns {Promise<[SummarizedCountyTrappingModel]>} all docs
 */
export const getAll = async () => {
  return SummarizedCountyTrappingModel.find();
};

/**
 * @description Inserts one week's data into the summarized county collection.
 * @param doc SummarizedCountyTrappingModel document
 */
export const insertOne = async (doc) => {
  const newDoc = new SummarizedCountyTrappingModel(doc);
  return newDoc.save();
};

/**
 * @description Updates one week's data in the summarized county collection.
 * @param {String} id ID of the document to update
 * @param doc SummarizedCountyTrappingModel document
 * @returns {Promise<SummarizedCountyTrappingModel>}
 */
export const updateById = async (id, doc) => {
  return SummarizedCountyTrappingModel.findByIdAndUpdate(id, doc, { new: true, omitUndefined: true });
};

/**
 * @description Deletes one week's data in the summarized county collection.
 * @param {String} id ID of the document to delete
 */
export const deleteById = async (id) => {
  return SummarizedCountyTrappingModel.findByIdAndDelete(id);
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
