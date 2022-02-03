import { UnsummarizedTrappingModel } from '../models';
import { runPipelineAll } from './pipeline';

import {
  CSV_TO_UNSUMMARIZED,
  STATE_TO_ABBREV_COMBINED,
} from '../constants';

import {
  deleteInsert,
  extractObjectFieldsCreator,
  getModelAttributes,
  processCSV,
  survey123UnpackCreator,
  survey123WebhookUnpackCreator,
  transformSurvey123GlobalID,
} from '../utils';

const unsummarizedModelAttributes = getModelAttributes(UnsummarizedTrappingModel);

/**
 * @description checks that any provided object contains all the model attributes, and filters out any other values
 * @param {Object} obj an object to check
 * @returns {Object|false} the filtered object containing only the model attributes if the provided object contains them, else false
 */
const extractModelAttributes = extractObjectFieldsCreator(unsummarizedModelAttributes);

/**
 * @description casts csv or json data to model schema
 * @param {Object} row object representing row of data
 * @returns {Object} cleaned row with proper schema
 */
const cleanCsv = (row) => {
  const cleanedArray = Object.entries(row)
    .map(([csvKey, value]) => [CSV_TO_UNSUMMARIZED[csvKey], value])
    .filter(([newKey]) => !!newKey);

  return Object.fromEntries(cleanedArray);
};

/**
 * @description transforms state name to state abbreviation in object
 * @param {Object} document input object with state field
 * @returns {Object} same object with modified state field to be state abbreviation instead of name
 */
const stateToAbbrevTransform = (document) => {
  return {
    ...document,
    state: STATE_TO_ABBREV_COMBINED[document.state],
  };
};

/**
 * @description uploads a csv to the unsummarized collection
 * @param {String} filename the csv filename on disk
 */
export const uploadCsv = async (filename) => {
  const unpacker = survey123UnpackCreator(cleanCsv, extractModelAttributes);

  const { docs, rowCount } = await processCSV(filename, (row) => {
    // attempt to unpack all weeks 1-6 and push all
    const unpackedData = unpacker(row);
    return unpackedData.map(stateToAbbrevTransform);
  });

  // spread out the operation into sequential deletes and inserts
  const bulkOp = docs.flatMap(deleteInsert).filter((obj) => !!obj);

  const insertOp = bulkOp.filter(({ insertOne }) => !!insertOne);
  const deleteOp = bulkOp.filter(({ deleteMany }) => !!deleteMany);

  const deleteRes = await UnsummarizedTrappingModel.bulkWrite(deleteOp, { ordered: false });
  const insertRes = await UnsummarizedTrappingModel.bulkWrite(insertOp, { ordered: false });

  console.log(`successfully parsed ${rowCount} rows from csv upload`);
  return { deleteRes, insertRes };
};

/**
 * upload survey123 data to unsummarized collection -- should be called by webhook
 * @param {Object} rawData raw data from survey123
 * @returns {Promise<Array>} delete result and insert result data
 */
export const uploadSurvey123FromWebhook = async (rawData) => {
  const unpacker = survey123WebhookUnpackCreator(cleanCsv, extractModelAttributes);

  const data = unpacker(rawData).map(stateToAbbrevTransform);

  // get globalID directly in case we need it below
  const globalID = transformSurvey123GlobalID(rawData.globalid);

  // either use deleteInsert or directly delete the data even if none of it is valid
  const deleteInsertOp = deleteInsert(data) ?? [{ deleteMany: { filter: { globalID } } }];

  const deleteInsertRes = await UnsummarizedTrappingModel.bulkWrite(deleteInsertOp, { ordered: true });

  // run entire pipeline
  runPipelineAll();

  return deleteInsertRes;
};
