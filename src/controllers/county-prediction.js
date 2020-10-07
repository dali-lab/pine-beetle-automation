import { CountyPredictionModel } from '../models';

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
