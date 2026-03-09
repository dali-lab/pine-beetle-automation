import { UnsummarizedTrappingModel } from '../models';

import {
  RESPONSE_TYPES,
} from '../constants';

import {
  csvDownloadCreator,
  csvStreamDownloadCreator,
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
 * @description Fetches all data from the unsummarized collection with pagination.
 * @param {Number|String} [page=1] page number (1-indexed)
 * @param {Number|String} [limit=1000] number of records per page
 * @returns {Promise<{data: Array, pagination: Object}>} paginated results
 */
export const getAll = async (page = 1, limit = 1000) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(5000, Math.max(1, parseInt(limit, 10) || 1000)); // max 5000 per page

  const skip = (parsedPage - 1) * parsedLimit;
  const total = await UnsummarizedTrappingModel.countDocuments();

  const data = await UnsummarizedTrappingModel.find()
    .sort({
      year: 1,
      state: 1,
      rangerDistrict: 1,
      county: 1,
      trap: 1,
    })
    .skip(skip)
    .limit(parsedLimit)
    .lean()
    .exec();

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
 * Fetches unsummarized trapping data depending on a filter with pagination.
 * @param {Number|String} startYear the earliest year to return, inclusive
 * @param {Number|String} endYear the latest year to return, inclusive
 * @param {String} state the state to return
 * @param {String} county the county to return
 * @param {String} rangerDistrict the ranger district to return
 * @param {Number|String} [page=1] page number (1-indexed)
 * @param {Number|String} [limit=1000] number of records per page
 * @returns {Promise<{data: Array, pagination: Object}>} paginated results
 */
export const getByFilter = async (startYear, endYear, state, county, rangerDistrict, page = 1, limit = 1000) => {
  const query = UnsummarizedTrappingModel.find();

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
  if (rangerDistrict) query.find({ rangerDistrict });

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(5000, Math.max(1, parseInt(limit, 10) || 1000)); // max 5000 per page

  const skip = (parsedPage - 1) * parsedLimit;
  const total = await query.countDocuments();

  const data = await query
    .sort({
      year: 1,
      state: 1,
      rangerDistrict: 1,
      county: 1,
      trap: 1,
    })
    .skip(skip)
    .limit(parsedLimit)
    .lean()
    .exec();

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

/**
 * @description downloads a csv of the collection via streaming (memory-efficient)
 * Supports all data if no year filters provided
 * @param {Object} filters query filters
 * @param {Object} res Express response object
 * @throws RESPONSE_TYPES.INTERNAL_ERROR for problem parsing CSV
 * @throws RESPONSE_TYPES.BAD_REQUEST for invalid parameters
 */
export const downloadCsvStream = csvStreamDownloadCreator(
  UnsummarizedTrappingModel,
  modelAttributes,
);
