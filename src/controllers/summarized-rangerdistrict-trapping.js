import { SummarizedRangerDistrictTrappingModel } from '../models';

/**
 * @description Fetches one week's data from the summarized ranger district collection.
 * @param {String} id ID of the document wanted
 * @returns {Promise<SummarizedRangerDistrictTrappingModel>} the document in question
 */
export const getById = async (id) => {
  return SummarizedRangerDistrictTrappingModel.findById(id);
};

/**
 * @description Fetches all data from the summarized ranger district collection.
 * @returns {Promise<[SummarizedRangerDistrictTrappingModel]>} all docs
 */
export const getAll = async () => {
  return SummarizedRangerDistrictTrappingModel.find();
};

/**
 * @description Inserts one week's data into the summarized ranger district collection.
 * @param doc SummarizedRangerDistrictTrappingModel document
 */
export const insertOne = async (doc) => {
  const newDoc = new SummarizedRangerDistrictTrappingModel(doc);
  return newDoc.save();
};

/**
 * @description Updates one week's data in the summarized ranger district collection.
 * @param {String} id ID of the document to update
 * @param doc SummarizedRangerDistrictTrappingModel document
 * @returns {Promise<SummarizedRangerDistrictTrappingModel>}
 */
export const updateById = async (id, doc) => {
  return SummarizedRangerDistrictTrappingModel.findByIdAndUpdate(id, doc, { new: true });
};

/**
 * @description Deletes one week's data in the summarized ranger district collection.
 * @param {String} id ID of the document to delete
 */
export const deleteById = async (id) => {
  return SummarizedRangerDistrictTrappingModel.findByIdAndDelete(id);
};

/**
 * @description Summarizes all trapping data at the ranger district level. Will overwrite all entries in this collection.
 */
export const summarizeAll = async () => {
  // return 'hello this is TBD';
};

/**
 * @description Summarizes all trapping data at the ranger district level for a given state and year.
 * Should be triggered by Survey123 data indicating a state has finished collection for a year.
 * @param {String} state the state to summarize
 * @param {Number} year the year to summarize
 */
export const summarizeStateYear = async (state, year) => {
  // return 'hello this is TBD';
};

export const getByFilter = async (startYear, endYear, state, county) => {
  // tbd
};
