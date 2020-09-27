import { UnsummarizedTrappingModel } from '../models';

/**
 * @description Fetches one week's data from the unsummarized collection.
 * @param {String} id ID of the document wanted
 * @returns {Promise<UnsummarizedTrappingModel>} the document in question
 */
export const getById = async (id) => {
  return UnsummarizedTrappingModel.findById(id);
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
 */
export const insertOne = async (doc) => {
  const newDoc = new UnsummarizedTrappingModel(doc);
  return newDoc.save();
};

/**
 * @description Updates one week's data in the unsummarized collection.
 * @param {String} id ID of the document to update
 * @param doc UnsummarizedTrappingModel document
 * @returns {Promise<UnsummarizedTrappingModel>}
 */
export const updateOne = async (id, doc) => {
  return UnsummarizedTrappingModel.findByIdAndUpdate(id, doc, { new: true });
};

/**
 * @description Deletes one week's data in the unsummarized collection.
 * @param {String} id ID of the document to delete
 */
export const deleteOne = async (id) => {
  return UnsummarizedTrappingModel.findByIdAndDelete(id);
};
