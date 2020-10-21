/* eslint-disable no-restricted-globals */
import { RDPredictionModel, SummarizedRangerDistrictTrappingModel } from '../models';
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

const modelAttributes = Object.keys(RDPredictionModel.schema.paths)
  .filter((attr) => attr !== '_id' && attr !== '__v');

// this is a function to clean req.body
const cleanBody = cleanBodyCreator(modelAttributes);

/**
 * @description downloads a csv of the entire collection
 * @throws RESPONSE_TYPES.INTERNAL_ERROR for problem parsing CSV
 * @returns {String} path to CSV file
 */
export const downloadCsv = csvDownloadCreator(RDPredictionModel, modelAttributes);

/**
 * @description Fetches one year's data from the ranger district prediction collection.
 * @param {String} id ID of the document wanted
 * @returns {Promise<RDPredictionModel>} the document in question
 * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
 */
export const getById = async (id) => {
  const doc = await RDPredictionModel.findById(id);
  if (!doc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return doc;
};

/**
   * @description Fetches all data from the ranger district prediction collection.
   * @returns {Promise<[RDPredictionModel]>} all docs
   */
export const getAll = async () => {
  return RDPredictionModel.find();
};

/**
   * @description Inserts one year's data into the ranger district prediction collection.
   * @param {Object} body request body to be cleaned and added
   * @returns {Promise<RDPredictionModel>}
   * @throws RESPONSE_TYPES.BAD_REQUEST if missing input
   */
export const insertOne = async (body) => {
  const cleanedBody = cleanBody(body);
  if (!cleanedBody) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'missing parameter(s) in request body');

  const newDoc = new RDPredictionModel(body);
  return newDoc.save();
};

/**
   * @description Updates one year's data in the ranger district prediction collection.
   * @param {String} id ID of the document to update
   * @param {Object} body request body to be cleaned and added
   * @returns {Promise<RDPredictionModel>}
   * @throws RESPONSE_TYPES.BAD_REQUEST if missing input
   * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
   */
export const updateById = async (id, body) => {
  const cleanedBody = cleanBody(body);
  if (!cleanedBody) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'missing parameter(s) in request body');

  const updatedDoc = await RDPredictionModel.findByIdAndUpdate(id, body, {
    new: true,
    omitUndefined: true,
  });
  if (!updatedDoc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return updatedDoc;
};

/**
   * @description Deletes one year's data in the ranger district prediction collection.
   * @param {String} id ID of the document to delete
   * @returns {Promise<RDPredictionModel>}
   * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
   */
export const deleteById = async (id) => {
  const deletedDoc = await RDPredictionModel.findByIdAndDelete(id);
  if (!deletedDoc) throw newError(RESPONSE_TYPES.NOT_FOUND, 'ID not found');
  return deletedDoc;
};

/**
   * @description generates all predictions for the ranger district level data.
   * @param {Array<SummarizedRangerDistrictTrappingModel> filteredTrappingData the array of data to generate predictions over
   * @param {Array<SummarizedRangerDistrictTrappingModel> allTrappingData the array of data to do reverse year lookups on
   * @returns {Promise<[RDPredictionModel]>} all docs
   */
const predictionGenerator = async (filteredTrappingData, allTrappingData) => {
  const promises = filteredTrappingData.map((trappingObject) => {
    return new Promise((resolve, reject) => {
      const {
        cleridPerDay,
        endobrev,
        rangerDistrict,
        spbPer2Weeks,
        spbPerDay,
        state,
        trapCount,
        year,
      } = trappingObject;

      // look for 1 year before
      const t1 = allTrappingData.find((obj) => {
        return obj.year === year - 1
          && obj.state === state
          && obj.rangerDistrict === rangerDistrict;
      });

      // look for 2 years before
      const t2 = allTrappingData.find((obj) => {
        return obj.year === year - 2
          && obj.state === state
          && obj.rangerDistrict === rangerDistrict;
      });

      // return nothing if missing years of data
      if (!(t1 && t2)) return resolve();

      const cleridst1 = t1.cleridPer2Weeks;
      const spotst1 = t1.spots;
      const spotst2 = t2.spots;

      // return nothing if missing data within years
      if (isNaN(spbPer2Weeks) || spbPer2Weeks === null || isNaN(cleridst1) || cleridst1 === null
      || isNaN(spotst1) || spotst1 === null || isNaN(spotst2) || spotst2 === null) {
        return resolve();
      }

      // run model and return results
      return rModel.runModel(spbPer2Weeks, cleridst1, spotst1, spotst2, endobrev)
        .then((prediction) => {
          const flattenedPred = Object.fromEntries(prediction.map((pred) => [pred._row, pred.Predictions]));

          resolve({
            cleridPerDay,
            endobrev,
            prediction: flattenedPred,
            rangerDistrict,
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

  // filter out blank responses
  const data = await Promise.all(promises);
  const updatedData = data.filter((obj) => !!obj);

  // upsert results into db
  const upsertOp = upsertOpCreator(getIndexes(RDPredictionModel));
  const writeOp = updatedData.map(upsertOp);
  return RDPredictionModel.bulkWrite(writeOp);
};

/**
 * @description generates all preds on ranger district level
 */
export const generateAllPredictions = async () => {
  const allTrappingData = await SummarizedRangerDistrictTrappingModel.aggregate([
    ...predictionFetchCreator('rangerDistrict'),
  ]).exec();

  return predictionGenerator(allTrappingData, allTrappingData);
};

/**
 * @description generates predictions by ranger district on a state and year
 * @param {String} state the state abbreviation
 * @param {String} year the year abbreviation
 */
export const generateStateYearPredictions = async (state, year) => {
  const filteredTrappingData = await SummarizedRangerDistrictTrappingModel.aggregate([
    ...matchStateYear(state, year),
    ...predictionFetchCreator('rangerDistrict'),
  ]).exec();

  const allTrappingData = await SummarizedRangerDistrictTrappingModel.aggregate([
    ...matchState(state),
    ...predictionFetchCreator('rangerDistrict'),
  ]).exec();

  return predictionGenerator(filteredTrappingData, allTrappingData);
};
