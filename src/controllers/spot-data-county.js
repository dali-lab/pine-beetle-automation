import { SpotDataCountyModel } from '../models';

import {
  COLLECTION_NAMES,
  CSV_TO_SPOTS_COUNTY,
  RESPONSE_TYPES,
} from '../constants';

import {
  cleanBodyCreator,
  cleanCsvCreator,
  csvDownloadCreator,
  csvUploadCreator,
  getIndexes,
  getModelAttributes,
  mergeSpotDataCreator,
  matchStateYear,
  matchYear,
  newError,
  upsertOpCreator,
} from '../utils';

const modelAttributes = getModelAttributes(SpotDataCountyModel);

// this is a function to clean req.body
const cleanBody = cleanBodyCreator(modelAttributes);

const cleanCsv = cleanCsvCreator(CSV_TO_SPOTS_COUNTY);

// provides the upsert operation for csv uploading
const csvUpserter = upsertOpCreator(getIndexes(SpotDataCountyModel));

/**
 * @description uploads a csv to the spot data county collection
 * @param {String} filename the csv filename on disk
 * @throws RESPONSE_TYPES.BAD_REQUEST for missing fields
 * @throws other errors depending on what went wrong
 */
export const uploadCsv = csvUploadCreator(SpotDataCountyModel, cleanCsv, cleanBody, null, null, csvUpserter);

/**
 * @description downloads a csv of the entire collection
 * @throws RESPONSE_TYPES.INTERNAL_ERROR for problem parsing CSV
 * @returns {String} path to CSV file
 */
export const downloadCsv = csvDownloadCreator(SpotDataCountyModel, modelAttributes);

/**
 * @description Fetches one year's data from the spot data county collection.
 * @param {String} id ID of the document wanted
 * @returns {Promise<SpotDataCountyModel>} the document in question
 * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
 */
export const getById = async (id) => {
  const doc = await SpotDataCountyModel.findById(id);
  if (!doc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return doc;
};

/**
 * @description Fetches all data from the spot data county collection.
 * @returns {Promise<[SpotDataCountyModel]>} all docs
 */
export const getAll = async () => {
  return SpotDataCountyModel.find();
};

/**
 * @description Inserts one year's data into the spot data county collection.
 * @param {Object} body request body to be cleaned and added
 * @returns {Promise<SpotDataCountyModel>}
 * @throws RESPONSE_TYPES.BAD_REQUEST if missing input
 */
export const insertOne = async (body) => {
  const cleanedBody = cleanBody(body);
  if (!cleanedBody) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'missing parameter(s) in request body');

  const newDoc = new SpotDataCountyModel(cleanedBody);
  return newDoc.save();
};

/**
 * @description Updates one year's data in the spot data county collection.
 * @param {String} id ID of the document wanted
 * @param {Object} body request body to be cleaned and added
 * @returns {Promise<SpotDataCountyModel>}
 * @throws RESPONSE_TYPES.BAD_REQUEST if missing input for body
 */
export const updateById = async (id, body) => {
  const cleanedBody = cleanBody(body);
  if (!cleanedBody) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'missing parameter(s) in request body');

  const updatedDoc = SpotDataCountyModel.findByIdAndUpdate(id, cleanedBody, { new: true, omitUndefined: true });
  if (!updatedDoc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return updatedDoc;
};

/**
 * @description Deletes one year's data in the spot data county collection.
 * @param {String} id ID of the document to delete
 * @returns {Promise<SpotDataCountyModel>} the deleted doc
 * @throws RESPONSE_TYPES.NOT_FOUND if ID cannot be found
 */
export const deleteById = async (id) => {
  const deletedDoc = await SpotDataCountyModel.findByIdAndDelete(id);
  if (!deletedDoc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return deletedDoc;
};

/**
 * @description merges all spot data based on a few factors
 * @param {String} timescale either t0 t1 or t2 for which year to look at
 * @param {Number} [year] optional year filter
 * @param {String} [state] optional state filter
 */
export const mergeSpots = async (timescale, year, state) => {
  // merge all with endobrev = 0
  const noendoPipeline = mergeSpotDataCreator(timescale)('county', COLLECTION_NAMES.SUMMARIZED.county, 0);
  if (year && state) noendoPipeline.unshift(...matchStateYear(state, year));
  else if (year) noendoPipeline.unshift(...matchYear(year));

  // merge all with endobrev = 1
  const endoPipeline = mergeSpotDataCreator(timescale)('county', COLLECTION_NAMES.SUMMARIZED.county, 1);
  if (year && state) noendoPipeline.unshift(...matchStateYear(state, year));
  else if (year) noendoPipeline.unshift(...matchYear(year));

  const noendo = SpotDataCountyModel.aggregate(noendoPipeline).exec();

  const endo = SpotDataCountyModel.aggregate(endoPipeline).exec();

  return Promise.all([noendo, endo]);
};
