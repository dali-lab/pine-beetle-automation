import { CountyPredictionModel, SummarizedCountyTrappingModel } from '../models';
import * as rModel from './r-model';

import { RESPONSE_TYPES } from '../constants';

import {
  cleanBodyCreator,
  newError,
} from '../utils';

const modelAttributes = Object.keys(CountyPredictionModel.schema.paths)
  .filter((attr) => attr !== '_id' && attr !== '__v');

// this is a function to clean req.body
const cleanBody = cleanBodyCreator(modelAttributes);

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
   * @param {Object} [filter] optional filter object
   * @returns {Promise<CountyPredictionModel>}
   * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
   */
export const generateAllPredictions = async (filter = {}) => {
  const trappingData = await SummarizedCountyTrappingModel.find(filter);

  trappingData.forEach(async (trappingObject) => {
    const {
      cleridPerDay,
      county,
      endobrev,
      spbPerDay,
      state,
      trapCount,
      year,
    } = trappingObject;

    const t1 = trappingData.find((obj) => {
      return obj.year === year - 1 && obj.state === state && obj.county === county;
    });

    const t2 = trappingData.find((obj) => {
      return obj.year === year - 2 && obj.state === state && obj.county === county;
    });

    // TODO: should we identify default values for when these are missing?
    if (!(t1 && t2)) return;

    const spb = trappingObject.spbCount;
    const cleridst1 = t1.cleridCount;
    const spotst1 = t1.spots;
    const spotst2 = t2.spots;

    // TODO: should we identify default values for when these are missing?
    if (!(spb && cleridst1 && spotst1 && spotst2)) return;

    const prediction = await rModel.runModel(
      spb,
      cleridst1,
      spotst1,
      spotst2,
      endobrev,
    );

    await insertOne({
      cleridPerDay,
      county,
      prediction,
      spbPerDay,
      state,
      trapCount,
      year,
    });
  });

  const predictions = await getAll();
  return predictions;
};
