import { UnsummarizedTrappingModel } from '../models';

import {
  RESPONSE_TYPES,
  newError,
} from '../constants';

/**
 * @param {Object} reqbody the proposed document to check from req.body
 * @returns true if body is valid, false otherwise
 */
const checkBody = (reqbody) => {
  const params = [
    'cleridCount',
    'county',
    'latitude',
    'longitude',
    'month',
    'rangerDistrict',
    'spbCount',
    'state',
    'week',
    'year',
  ];
  return params.reduce((hasAllKeys, key) => {
    return hasAllKeys && Object.keys(reqbody).includes(key);
  }, true);
};

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
 * @description Inserts one week's data into the unsummarized collection.
 * @param doc UnsummarizedTrappingModel document
 * @returns {Promise<UnsummarizedTrappingModel>}
 * @throws RESPONSE_TYPES.BAD_REQUEST if missing input
 */
export const insertOne = async (doc) => {
  if (!checkBody(doc)) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'missing parameter(s) in request body');

  const newDoc = new UnsummarizedTrappingModel(doc);
  return newDoc.save();
};

/**
 * @description Updates one week's data in the unsummarized collection.
 * @param {String} id ID of the document to update
 * @param doc UnsummarizedTrappingModel document
 * @returns {Promise<UnsummarizedTrappingModel>}
 * @throws RESPONSE_TYPES.BAD_REQUEST if missing input
 * @throws RESPONSE_TYPES.NOT_FOUND if no doc found for id
 */
export const updateById = async (id, doc) => {
  if (!checkBody(doc)) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'missing parameter(s) in request body');

  const updatedDoc = await UnsummarizedTrappingModel.findByIdAndUpdate(id, doc, {
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
