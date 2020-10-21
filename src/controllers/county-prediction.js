/* eslint-disable no-restricted-globals */
import { CountyPredictionModel, SummarizedCountyTrappingModel } from '../models';
import * as rModel from './r-model';

import { RESPONSE_TYPES } from '../constants';

import {
  cleanBodyCreator,
  csvDownloadCreator,
  getIndexes,
  predictionFetchCreator,
  matchState,
  matchStateYear,
  newError,
  upsertOpCreator,
} from '../utils';

const modelAttributes = Object.keys(CountyPredictionModel.schema.paths)
  .filter((attr) => attr !== '_id' && attr !== '__v');

// this is a function to clean req.body
const cleanBody = cleanBodyCreator(modelAttributes);

/**
 * @description downloads a csv of the entire collection
 * @throws RESPONSE_TYPES.INTERNAL_ERROR for problem parsing CSV
 * @returns {String} path to CSV file
 */
export const downloadCsv = csvDownloadCreator(CountyPredictionModel, modelAttributes);

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
   * @description generates all predictions for the county level data.
   * @param {Array<SummarizedCountyTrappingModel> filteredTrappingData the array of data to generate predictions over
   * @param {Array<SummarizedCountyTrappingModel> allTrappingData the array of data to do reverse year lookups on
   * @returns {Promise<[CountyPredictionModel]>} all docs
   */
const predictionGenerator = async (filteredTrappingData, allTrappingData) => {
  const promises = filteredTrappingData.map((trappingObject) => {
    return new Promise((resolve, reject) => {
      const {
        cleridPerDay,
        county,
        endobrev,
        spbPer2Weeks,
        spbPerDay,
        state,
        trapCount,
        year,
      } = trappingObject;
      // console.log(trappingObject);

      const t1 = allTrappingData.find((obj) => {
        return obj.year === year - 1
          && obj.state === state
          && obj.county === county;
      });

      const t2 = allTrappingData.find((obj) => {
        return obj.year === year - 2
          && obj.state === state
          && obj.county === county;
      });

      // TODO: should we identify default values for when these are missing?
      if (!(t1 && t2)) return resolve();

      const cleridst1 = t1.cleridPer2Weeks;
      const spotst1 = t1.spots;
      const spotst2 = t2.spots;
      // console.log(spbPer2Weeks, cleridst1, spotst1, spotst2);

      // TODO: should we identify default values for when these are missing?
      if (isNaN(spbPer2Weeks) || spbPer2Weeks === null || isNaN(cleridst1) || cleridst1 === null
      || isNaN(spotst1) || spotst1 === null || isNaN(spotst2) || spotst2 === null) {
        return resolve();
      }

      return rModel.runModel(spbPer2Weeks, cleridst1, spotst1, spotst2, endobrev)
        .then((prediction) => {
          const flattenedPred = Object.fromEntries(prediction.map((pred) => [pred._row, pred.Predictions]));

          resolve({
            cleridPerDay,
            county,
            endobrev,
            prediction: flattenedPred,
            spbPerDay,
            state,
            trapCount,
            year,
          });
        })
        .catch((error) => {
          reject(error);
        });
    });
  });

  const data = await Promise.all(promises);
  const updatedData = data.filter((obj) => !!obj);

  const upsertOp = upsertOpCreator(getIndexes(CountyPredictionModel));
  const writeOp = updatedData.map(upsertOp);
  return CountyPredictionModel.bulkWrite(writeOp);
};

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
  const filteredTrappingData = await SummarizedCountyTrappingModel.aggregate([
    ...matchStateYear(state, year),
    ...predictionFetchCreator('county'),
  ]).exec();

  const allTrappingData = await SummarizedCountyTrappingModel.aggregate([
    ...matchState(state),
    ...predictionFetchCreator('county'),
  ]).exec();

  return predictionGenerator(filteredTrappingData, allTrappingData);
};
