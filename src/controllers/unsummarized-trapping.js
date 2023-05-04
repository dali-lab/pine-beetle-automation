import { UnsummarizedTrappingModel } from '../models';

import {
  RESPONSE_TYPES,
} from '../constants';

import {
  csvDownloadCreator,
  extractObjectFieldsCreator,
  getModelAttributes,
  newError,
} from '../utils';

const modelAttributes = getModelAttributes(UnsummarizedTrappingModel);

/**
 * @description checks that any provided object contains all the model attributes, and filters out any other values
 * @param {Object} obj an object to check
 * @returns {Object|false} the filtered object containing only the model attributes if the provided object contains them, else false
 */
const extractModelAttributes = extractObjectFieldsCreator(modelAttributes);

/**
 * @description Fetches one week's data from the unsummarized collection.
 * @param {String} id ID of the document wanted
 * @returns {Promise<UnsummarizedTrappingModel>} the document in question
 * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
 */
export const getById = async (id) => {
  const doc = await UnsummarizedTrappingModel.findById(id);
  if (!doc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return doc;
};

/**
 * @description Fetches all data from the unsummarized collection.
 * @returns {Promise<[UnsummarizedTrappingModel]>} all docs
 */
export const getAll = async () => {
  return UnsummarizedTrappingModel.find();
};

/**
 * Fetches summarized county trapping data depending on a filter.
 * @param {Number} startYear the earliest year to return, inclusive
 * @param {Number} endYear the latest year to return, inclusive
 * @param {String} state the state to return
 * @param {String} county the county to return
 * @param {String} rangerDistrict the ranger district to return
 */
export const getByFilter = async (startYear, endYear, state, county, rangerDistrict) => {
  const query = UnsummarizedTrappingModel.find();

  if (startYear) query.find({ year: { $gte: startYear } });
  if (endYear) query.find({ year: { $lte: endYear } });
  if (state) query.find({ state });
  if (county) query.find({ county });
  if (rangerDistrict) query.find({ rangerDistrict });

  return query.exec();
};

/**
 * @description Inserts one week's data into the unsummarized collection.
 * @param {Object} body request body to be cleaned and added
 * @returns {Promise<UnsummarizedTrappingModel>}
 * @throws RESPONSE_TYPES.BAD_REQUEST if missing input
 */
export const insertOne = async (body) => {
  const cleanedBody = extractModelAttributes(body);

  const newDoc = new UnsummarizedTrappingModel(cleanedBody);
  return newDoc.save();
};

/**
 * @description Updates one week's data in the unsummarized collection.
 * @param {String} id ID of the document to update
 * @param {Object} body request body to be cleaned and added
 * @returns {Promise<UnsummarizedTrappingModel>}
 * @throws RESPONSE_TYPES.BAD_REQUEST if missing input
 * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
 */
export const updateById = async (id, body) => {
  const cleanedBody = extractModelAttributes(body);

  const updatedDoc = await UnsummarizedTrappingModel.findByIdAndUpdate(id, cleanedBody, {
    new: true,
    omitUndefined: true,
  });
  if (!updatedDoc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return updatedDoc;
};

/**
 * @description Deletes one week's data in the unsummarized collection.
 * @param {String} id ID of the document to delete
 * @returns {Promise<UnsummarizedTrappingModel>}
 * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
 */
export const deleteById = async (id) => {
  const deletedDoc = await UnsummarizedTrappingModel.findByIdAndDelete(id);
  if (!deletedDoc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return deletedDoc;
};

/**
 * @description Deletes all data in the unsummarized collection.
 * @param {Object={}} [options] optional options object
 * @returns {Promise<UnsummarizedTrappingModel>}
 * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
 */
export const deleteAll = async (options) => {
  return UnsummarizedTrappingModel.deleteMany(options);
};

/**
 * @description downloads a csv of the entire collection
 * @throws RESPONSE_TYPES.INTERNAL_ERROR for problem parsing CSV
 * @returns {String} path to CSV file
 */
export const downloadCsv = csvDownloadCreator(UnsummarizedTrappingModel, modelAttributes);
