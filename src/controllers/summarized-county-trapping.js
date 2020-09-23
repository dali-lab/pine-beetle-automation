import { SummarizedCountyTrappingModel } from '../models';

/**
 * @description Fetches one week's data from the summarized county collection.
 * @param {String} id ID of the document wanted
 * @returns {Promise<SummarizedCountyTrappingModel>} the document in question
 */
export const getById = async (id) => {
  try {
    return SummarizedCountyTrappingModel.findById(id);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/**
 * @description Fetches all data from the summarized county collection.
 * @returns {Promise<[SummarizedCountyTrappingModel]>} all docs
 */
export const getAll = async () => {
  try {
    return SummarizedCountyTrappingModel.find();
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/**
 * @description Inserts one week's data into the summarized county collection.
 * @param doc SummarizedCountyTrappingModel document
 */
export const insertOne = async (doc) => {
  try {
    const newDoc = new SummarizedCountyTrappingModel(doc);
    return newDoc.save();
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/**
 * @description Updates one week's data in the summarized county collection.
 * @param {String} id ID of the document to update
 * @param doc SummarizedCountyTrappingModel document
 * @returns {Promise<SummarizedCountyTrappingModel>}
 */
export const updateOne = async (id, doc) => {
  try {
    return SummarizedCountyTrappingModel.findByIdAndUpdate(id, doc, { new: true });
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/**
 * @description Deletes one week's data in the summarized county collection.
 * @param {String} id ID of the document to delete
 */
export const deleteOne = async (id) => {
  try {
    return SummarizedCountyTrappingModel.findByIdAndDelete(id);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/**
 * @description Summarizes all trapping data at the county level. Will overwrite all entries in this collection.
 */
export const summarizeAll = async () => {
  // try {
  //   return 'hello this is TBD';
  // } catch (error) {
  //   console.log(error);
  //   throw error;
  // }
};

/**
 * @description Summarizes all trapping data at the county level for a given state and year.
 * Should be triggered by Survey123 data indicating a state has finished collection for a year.
 * @param {String} state the state to summarize
 * @param {Number} year the year to summarize
 */
export const summarizeStateYear = async (state, year) => {
  // try {
  //   return 'hello this is TBD';
  // } catch (error) {
  //   console.log(error);
  //   throw error;
  // }
};
