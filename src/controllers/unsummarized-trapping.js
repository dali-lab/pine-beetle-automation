import compose from 'compose-function';

import { UnsummarizedTrappingModel } from '../models';

import {
  CSV_TO_UNSUMMARIZED,
  RANGER_DISTRICT_NAME_MAPPING,
  STATE_TO_ABBREV,
  RESPONSE_TYPES,
} from '../constants';

import {
  cleanBodyCreator,
  cleanCsvCreator,
  csvDownloadCreator,
  getModelAttributes,
  newError,
  unsummarizedDataCsvUploadCreator,
} from '../utils';

const modelAttributes = getModelAttributes(UnsummarizedTrappingModel);

// this is a function to clean req.body
const cleanBody = cleanBodyCreator(modelAttributes);

const cleanCsv = cleanCsvCreator(CSV_TO_UNSUMMARIZED);

// removes strange null valued rows
const filterNulls = (document) => document.cleridCount !== 'NULL' && document.spbCount !== 'NULL';

// transform state name
const stateToAbbrevTransform = (document) => ({
  ...document,
  state: STATE_TO_ABBREV[document.state],
});

// transform ranger district name
const rangerDistrictNameTransform = (document) => ({
  ...document,
  rangerDistrict: RANGER_DISTRICT_NAME_MAPPING[document.rangerDistrict],
});

const transformDocument = compose(stateToAbbrevTransform, rangerDistrictNameTransform);

/**
 * @description uploads a csv to the unsummarized collection
 * @param {String} filename the csv filename on disk
 * @throws RESPONSE_TYPES.BAD_REQUEST for missing fields
 * @throws other errors depending on what went wrong
 */
export const uploadCsv = unsummarizedDataCsvUploadCreator(
  UnsummarizedTrappingModel,
  cleanCsv,
  cleanBody,
  filterNulls,
  transformDocument,
);

/**
 * @description downloads a csv of the entire collection
 * @throws RESPONSE_TYPES.INTERNAL_ERROR for problem parsing CSV
 * @returns {String} path to CSV file
 */
export const downloadCsv = csvDownloadCreator(UnsummarizedTrappingModel, modelAttributes);

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
  const cleanedBody = cleanBody(body);
  if (!cleanedBody) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'missing parameter(s) in request body');

  const newDoc = new UnsummarizedTrappingModel(body);
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
  const cleanedBody = cleanBody(body);
  if (!cleanedBody) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'missing parameter(s) in request body');

  const updatedDoc = await UnsummarizedTrappingModel.findByIdAndUpdate(id, body, {
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
