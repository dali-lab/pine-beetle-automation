/* eslint-disable no-restricted-globals */
import { CountyPredictionModel, SummarizedCountyTrappingModel } from '../models';
import * as rModel from './r-model';

import { RESPONSE_TYPES } from '../constants';

import {
  cleanBodyCreator,
  csvDownloadCreator,
  getIndexes,
  predictionFetchCreator,
  predictionGeneratorCreator,
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

const predictionGenerator = predictionGeneratorCreator('county', rModel.runModel, CountyPredictionModel, upsertOp);

/**
   * @description generates all predictions for the county level data.
   * @param {Array<SummarizedCountyTrappingModel> sourceTrappingData the array of data to generate predictions over
   * @param {Array<SummarizedCountyTrappingModel> t1TrappingData the array of data to do reverse year lookups on
   * @returns {Promise<[CountyPredictionModel]>} all docs
   */
// const predictionGenerator = async (sourceTrappingData, t1TrappingData) => {
//   const promises = sourceTrappingData.map((trappingObject) => {
//     return new Promise((resolve, reject) => {
//       const {
//         cleridPerDay,
//         county,
//         endobrev,
//         spbPer2Weeks,
//         spbPerDay,
//         spotst1,
//         spotst2,
//         state,
//         trapCount,
//         year,
//       } = trappingObject;
//
//       // look for 1 year before
//       const t1 = t1TrappingData.find((obj) => {
//         return obj.year === year - 1
//           && obj.state === state
//           && obj.county === county;
//       });
//
//       // return nothing if missing years of data
//       if (!t1) return resolve();
//
//       const cleridst1 = t1.cleridPer2Weeks;
//
//       // return nothing if missing data within years
//       if (isNaN(spbPer2Weeks) || spbPer2Weeks === null || isNaN(cleridst1) || cleridst1 === null
//       || isNaN(spotst1) || spotst1 === null || isNaN(spotst2) || spotst2 === null) {
//         return resolve();
//       }
//
//       // run model and return results
//       return rModel.runModel(spbPer2Weeks, cleridst1, spotst1, spotst2, endobrev)
//         .then((prediction) => {
//           const flattenedPred = Object.fromEntries(prediction.map((pred) => [pred._row, pred.Predictions]));
//
//           resolve({
//             cleridPerDay,
//             county,
//             endobrev,
//             prediction: flattenedPred,
//             spbPerDay,
//             state,
//             trapCount,
//             year,
//           });
//         })
//         .catch((error) => {
//           reject(error);
//         });
//     });
//   });
//
//   // filter out blank responses
//   const data = await Promise.all(promises);
//   const updatedData = data.filter((obj) => !!obj);
//
//   // upsert results into db
//   const upsertOp = upsertOpCreator(getIndexes(CountyPredictionModel));
//   const writeOp = updatedData.map(upsertOp);
//   return CountyPredictionModel.bulkWrite(writeOp);
// };
//
// const tabularPredictionGenerator = async (sourceTrappingData, t1TrappingData) => {
//   const rawinputs = sourceTrappingData.map((trappingObject) => {
//     const {
//       county,
//       spbPer2Weeks: SPB,
//       spotst1,
//       spotst2,
//       state,
//       year,
//     } = trappingObject;
//
//     // look for 1 year before
//     const t1 = t1TrappingData.find((obj) => {
//       return obj.year === year - 1
//           && obj.state === state
//           && obj.county === county;
//     });
//
//     const cleridst1 = t1?.cleridPer2Weeks; // default 77 if not found, do that later
//
//     if (SPB === null || SPB === undefined || cleridst1 === null || cleridst1 === undefined
//     || spotst1 === null || spotst1 === undefined || spotst2 === null || spotst2 === undefined) {
//       return null;
//     }
//
//     return {
//       ...trappingObject,
//       cleridst1,
//       SPB,
//     };
//   });
//
//   const inputs = rawinputs.filter((obj) => !!obj);
//   const allPredictions = await rModel.runModel(inputs);
//   const updatedData = inputs.map((doc, index) => {
//     const {
//       cleridPerDay,
//       county,
//       endobrev,
//       spbPerDay,
//       state,
//       SPB,
//       cleridst1,
//       spotst1,
//       spotst2,
//       trapCount,
//       year,
//     } = doc;
//
//     return {
//       cleridPerDay,
//       county,
//       endobrev,
//       prediction: allPredictions[index],
//       SPB,
//       spotst1,
//       cleridst1,
//       spotst2,
//       spbPerDay,
//       state,
//       trapCount,
//       year,
//     };
//   });
//
//   return updatedData;
//   // upsert results into db
//   // const upsertOp = upsertOpCreator(getIndexes(CountyPredictionModel));
//   // const writeOp = updatedData.map(upsertOp);
//   // return CountyPredictionModel.bulkWrite(writeOp);
// };
//
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
