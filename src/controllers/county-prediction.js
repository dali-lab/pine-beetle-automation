/* eslint-disable no-restricted-globals */
import { CountyPredictionModel, SummarizedCountyTrappingModel } from '../models';
import * as rModel from './r-model';

import { RESPONSE_TYPES } from '../constants';

import {
  cleanBodyCreator,
  csvDownloadCreator,
  getIndexes,
  getModelAttributes,
  predictionFetchCreator,
  predictionGeneratorCreator,
  matchStateYear,
  newError,
  upsertOpCreator,
} from '../utils';

const modelAttributes = getModelAttributes(CountyPredictionModel);

// this is a function to clean req.body
const cleanBody = cleanBodyCreator(modelAttributes);

/**
 * @description downloads a csv of the entire collection
 * @throws RESPONSE_TYPES.INTERNAL_ERROR for problem parsing CSV
 * @returns {String} path to CSV file
 */
export const downloadCsv = csvDownloadCreator(CountyPredictionModel, modelAttributes);

// upsert transform
const upsertOp = upsertOpCreator(getIndexes(CountyPredictionModel));

/**
 * @description Fetches one year's data from the county prediction collection.
 * @param {String} id ID of the document wanted
 * @returns {Promise<CountyPredictionModel>} the document in question
 * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
 */
export const getById = async (id) => {
  const doc = await CountyPredictionModel.findById(id);
  if (!doc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return doc;
};

/**
   * @description Fetches all data from the county prediction collection.
   * @returns {Promise<[CountyPredictionModel]>} all docs
   */
export const getAll = async () => {
  return CountyPredictionModel.find();
};

/**
   * @description Inserts one year's data into the county prediction collection.
   * @param {Object} body request body to be cleaned and added
   * @returns {Promise<CountyPredictionModel>}
   * @throws RESPONSE_TYPES.BAD_REQUEST if missing input
   */
export const insertOne = async (body) => {
  const cleanedBody = cleanBody(body);
  if (!cleanedBody) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'missing parameter(s) in request body');

  const newDoc = new CountyPredictionModel(body);
  return newDoc.save();
};

/**
   * @description Updates one year's data in the county prediction collection.
   * @param {String} id ID of the document to update
   * @param {Object} body request body to be cleaned and added
   * @returns {Promise<CountyPredictionModel>}
   * @throws RESPONSE_TYPES.BAD_REQUEST if missing input
   * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
   */
export const updateById = async (id, body) => {
  const cleanedBody = cleanBody(body);
  if (!cleanedBody) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'missing parameter(s) in request body');

  const updatedDoc = await CountyPredictionModel.findByIdAndUpdate(id, body, {
    new: true,
    omitUndefined: true,
  });
  if (!updatedDoc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return updatedDoc;
};

/**
   * @description Deletes one year's data in the county prediction collection.
   * @param {String} id ID of the document to delete
   * @returns {Promise<CountyPredictionModel>}
   * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
   */
export const deleteById = async (id) => {
  const deletedDoc = await CountyPredictionModel.findByIdAndDelete(id);
  if (!deletedDoc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return deletedDoc;
};

/**
 * @description Deletes all data in the collection
 * @returns {Promise}
 */
export const deleteAll = async () => {
  return CountyPredictionModel.deleteMany();
};

/**
 * @description Deletes all data in the collection
 * @param {String} state state name
 * @param {Number} year year
 * @returns {Promise}
 */
export const deleteStateYear = async (state, year) => {
  return CountyPredictionModel.deleteMany({ state, year });
};

/**
   * @description generates all predictions for the county level data.
   * @param {Array<SummarizedCountyTrappingModel> sourceTrappingData the array of data to generate predictions over
   * @param {Array<SummarizedCountyTrappingModel> t1TrappingData the array of data to do reverse year lookups on
   * @returns {Promise<[CountyPredictionModel]>} all docs
   */
const predictionGenerator = predictionGeneratorCreator('county', rModel.runModel, CountyPredictionModel, upsertOp);

/**
 * @description generates all preds on county level
 */
export const generateAllPredictions = async () => {
  const allTrappingData = await SummarizedCountyTrappingModel.aggregate([
    ...predictionFetchCreator('county'),
  ]).exec();

  return predictionGenerator(allTrappingData, allTrappingData);
};

/**
 * @description generates predictions by county on a state and year
 * @param {String} state the state abbreviation
 * @param {String} year the year abbreviation
 */
export const generateStateYearPredictions = async (state, year) => {
  const sourcePromise = SummarizedCountyTrappingModel.aggregate([
    ...matchStateYear(state, year),
    ...predictionFetchCreator('county'),
  ]).exec();

  const t1Promise = SummarizedCountyTrappingModel.aggregate([
    ...matchStateYear(state, year - 1),
    ...predictionFetchCreator('county'),
  ]).exec();

  const sourceTrappingData = await sourcePromise;
  const t1TrappingData = await t1Promise;

  return predictionGenerator(sourceTrappingData, t1TrappingData);
};
