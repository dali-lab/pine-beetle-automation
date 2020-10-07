import numeral from 'numeral';
import { SpotDataModel } from '../models';

import {
  RESPONSE_TYPES,
  CSV_TO_SPOTS,
} from '../constants';

import {
  cleanBodyCreator,
  cleanCsvCreator,
  csvDownloadCreator,
  csvUploadCreator,
  // matchStateYear,
  mergeSpotDataCreator,
  newError,
} from '../utils';

const modelAttributes = Object.keys(SpotDataModel.schema.paths)
  .filter((attr) => attr !== '_id' && attr !== '__v');

// this is a function to clean req.body
const cleanBody = cleanBodyCreator(modelAttributes);

const cleanCsv = cleanCsvCreator(CSV_TO_SPOTS);

const csvFilter = (proposedDoc) => (proposedDoc.spots && numeral(proposedDoc.spots).value());

/**
 * @description uploads a csv to the unsummarized collection
 * @param {String} filename the csv filename on disk
 * @throws RESPONSE_TYPES.BAD_REQUEST for missing fields
 * @throws other errors depending on what went wrong
 */
export const uploadCsv = csvUploadCreator(SpotDataModel, cleanCsv, cleanBody, csvFilter);

/**
 * @description downloads a csv of the entire collection
 * @throws RESPONSE_TYPES.INTERNAL_ERROR for problem parsing CSV
 * @returns {String} path to CSV file
 */
export const downloadCsv = csvDownloadCreator(SpotDataModel, modelAttributes);

/**
 * @description Fetches one year's data from the spot data collection.
 * @param {String} id ID of the document wanted
 * @returns {Promise<SpotDataModel>} the document in question
 * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
 */
export const getById = async (id) => {
  const doc = await SpotDataModel.findById(id);
  if (!doc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return doc;
};

/**
 * @description Fetches all data from the spot data collection.
 * @returns {Promise<[SpotDataModel]>} all docs
 */
export const getAll = async () => {
  return SpotDataModel.find();
};

/**
 * @description Inserts one year's data into the spot data collection.
 * @param {Object} body request body to be cleaned and added
 * @returns {Promise<SpotDataModel>}
 * @throws RESPONSE_TYPES.BAD_REQUEST if missing input
 */
export const insertOne = async (body) => {
  const cleanedBody = cleanBody(body);
  if (!cleanedBody) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'missing parameter(s) in request body');

  const newDoc = new SpotDataModel(cleanedBody);
  return newDoc.save();
};

/**
 * @description Updates one year's data in the spot data collection.
 * @param {String} id ID of the document wanted
 * @param {Object} body request body to be cleaned and added
 * @returns {Promise<SpotDataModel>}
 * @throws RESPONSE_TYPES.BAD_REQUEST if missing input for body
 */
export const updateById = async (id, body) => {
  const cleanedBody = cleanBody(body);
  if (!cleanedBody) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'missing parameter(s) in request body');

  const updatedDoc = SpotDataModel.findByIdAndUpdate(id, cleanedBody, { new: true, omitUndefined: true });
  if (!updatedDoc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return updatedDoc;
};

/**
 * @description Deletes one year's data in the unsummarized collection.
 * @param {String} id ID of the document to delete
 * @returns {Promise<SpotDataModel>} the deleted doc
 * @throws RESPONSE_TYPES.NOT_FOUND if ID cannot be found
 */
export const deleteById = async (id) => {
  const deletedDoc = await SpotDataModel.findByIdAndDelete(id);
  if (!deletedDoc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return deletedDoc;
};

export const mergeCounty = async () => {
  return SpotDataModel.aggregate([
    ...mergeSpotDataCreator('county', 'summarizedcountytrappings'),
  ]);
};
