/* eslint-disable no-restricted-globals */
import { RDPredictionModel, SummarizedRangerDistrictTrappingModel } from '../models';
import * as rModel from './r-model';

import { RESPONSE_TYPES } from '../constants';

import {
  cleanBodyCreator,
  getIndexes,
  newError,
  upsertOpCreator,
} from '../utils';

const modelAttributes = Object.keys(RDPredictionModel.schema.paths)
  .filter((attr) => attr !== '_id' && attr !== '__v');

// this is a function to clean req.body
const cleanBody = cleanBodyCreator(modelAttributes);

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
   * @param {Object} [filter] optional filter object
   * @returns {Promise<[RDPredictionModel]>} all docs
   */
export const generateAllPredictions = async (filter = {}) => {
  const filteredTrappingData = await SummarizedRangerDistrictTrappingModel.find(filter);
  const allTrappingData = Object.keys(filter).length > 0 ? await SummarizedRangerDistrictTrappingModel.find({}) : filteredTrappingData;

  const promises = filteredTrappingData.map((trappingObj) => {
    return new Promise((resolve, reject) => {
      const {
        cleridPerDay,
        endobrev,
        rangerDistrict,
        spbPerDay,
        state,
        trapCount,
        year,
      } = trappingObj;

      const t1 = allTrappingData.find((obj) => {
        return parseInt(obj.year, 10) === parseInt(year - 1, 10) && obj.state === state && obj.rangerDistrict === rangerDistrict;
      });

      const t2 = allTrappingData.find((obj) => {
        return parseInt(obj.year, 10) === parseInt(year - 2, 10) && obj.state === state && obj.rangerDistrict === rangerDistrict;
      });

      if (!t1 || !t2) return resolve();

      const spb = trappingObj.spbCount;
      const cleridst1 = t1.cleridCount;
      const spotst1 = t1.spots;
      const spotst2 = t2.spots;

      if (isNaN(spb) || spb === null || isNaN(cleridst1) || cleridst1 === null
      || isNaN(spotst1) || spotst1 === null || isNaN(spotst2) || spotst2 === null) {
        return resolve();
      }

      return rModel.runModel(spb, cleridst1, spotst1, spotst2, endobrev)
        .then((prediction) => {
          resolve({
            cleridPerDay,
            prediction,
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
  const data = await Promise.all(promises);
  const updatedData = data.filter((obj) => !!obj);

  const upsertOp = upsertOpCreator(getIndexes(RDPredictionModel));
  const writeOp = updatedData.map(upsertOp);
  await RDPredictionModel.bulkWrite(writeOp);

  return getAll();
};
