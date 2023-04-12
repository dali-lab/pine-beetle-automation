import { UnsummarizedTrappingModel } from '../models';
import { runPipelineAll } from './pipeline';

import {
  STATE_TO_ABBREV_COMBINED,
  RESPONSE_TYPES,
} from '../constants';

import {
  deleteInsert,
  extractObjectFieldsCreator,
  getModelAttributes,
  processCSV,
  transformSurvey123GlobalID,
  newError,
} from '../utils';

const unsummarizedModelAttributes = getModelAttributes(UnsummarizedTrappingModel);

/**
 * @description checks that any provided object contains all the model attributes, and filters out any other values
 * @param {Object} obj an object to check
 * @returns {Object|false} the filtered object containing only the model attributes if the provided object contains them, else false
 */
const extractModelAttributes = extractObjectFieldsCreator(unsummarizedModelAttributes);

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

const ordinalStrings = Object.entries({
  1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th', 6: '6th',
});

/**
 * @description uploads a csv to the unsummarized collection
 * @param {String} filename the csv filename on disk
 */
export const uploadCsv = async (filename) => {
  const unpacker = (sixWeekData) => {
    return ordinalStrings.map(([weekNum, weekOrdinal]) => {
      // convert fields to unsummarized schema
      const convertedRawData = {
        bloom: sixWeekData['What bloomed?'],
        bloomDate: sixWeekData['Date of Inital bloom'], // fix spelling
        cleridCount: sixWeekData[`Number Clerids (${weekOrdinal} Collection)`],
        collectionDate: sixWeekData[`Date of Collection ${weekNum}`],
        county: sixWeekData['County/Parish'],
        daysActive: sixWeekData[`Active Trapping Days (${weekOrdinal} Collection)`],
        endobrev: 1,
        FIPS: null,
        globalID: sixWeekData.GlobalID,
        latitude: sixWeekData.Latitude,
        longitude: sixWeekData.Longitude,
        lure: sixWeekData['Trap Lure'],
        rangerDistrict: sixWeekData['National Forest (Ranger District)'],
        season: sixWeekData.Season,
        sirexLure: 'Y',
        spbCount: sixWeekData[`Number SPB (${weekOrdinal} Collection)`],
        startDate: sixWeekData['Traps set out on:'],
        state: sixWeekData.State,
        trap: sixWeekData['Trap name'],
        year: sixWeekData.Year,
      };

      const cleanedData = extractModelAttributes(convertedRawData);

      if (!cleanedData) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'missing fields in csv');

      if (!cleanedData.collectionDate || !cleanedData.daysActive || cleanedData.daysActive === '0') return undefined; // no data for this week

      const shouldDeleteSurvey = sixWeekData['Delete this survey?'] === 'yes';
      const isFinalCollection = ['yes', '', null, undefined].includes(sixWeekData['Is this the Final Collection?']);

      return {
        ...cleanedData,
        shouldInsert: !shouldDeleteSurvey && isFinalCollection, // only insert if data is good and final
      };
    }).filter((doc) => !!doc); // remove all nulls
  };

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
 * @description uploads survey123 data to unsummarized collection - should be called by webhook
 * @param {Object} rawData raw data from survey123
 * @returns {Promise<Array>} delete result and insert result data
 */
export const uploadSurvey123FromWebhook = async (rawData) => {
  const unpacker = (sixWeekData) => {
    return ordinalStrings.map(([weekNum]) => {
      // convert fields to unsummarized schema
      const convertedRawData = {
        bloom: sixWeekData.Species_Bloom,
        bloomDate: sixWeekData.Initial_Bloom,
        cleridCount: sixWeekData[`Number_Clerids${weekNum}`],
        collectionDate: sixWeekData[`CollectionDate${weekNum}`],
        county: sixWeekData.County,
        daysActive: sixWeekData[`TrappingInterval${weekNum}`],
        endobrev: 1,
        FIPS: null,
        globalID: transformSurvey123GlobalID(sixWeekData.globalid), // transform into regular form
        latitude: sixWeekData.Latitude,
        longitude: sixWeekData.Longitude,
        lure: sixWeekData.Trap_Lure,
        rangerDistrict: sixWeekData.Nat_Forest_Ranger_Dist,
        season: sixWeekData.Season,
        sirexLure: 'Y',
        spbCount: sixWeekData[`Number_SPB${weekNum}`],
        startDate: sixWeekData.TrapSetDate,
        state: sixWeekData.USA_State,
        trap: sixWeekData.Trap_name,
        year: sixWeekData.Year,
      };

      const cleanedData = extractModelAttributes(convertedRawData);

      if (!cleanedData) throw newError(RESPONSE_TYPES.BAD_REQUEST, 'missing fields in webhook data');
      if (!cleanedData.collectionDate || !cleanedData.daysActive || cleanedData.daysActive === '0') return undefined; // no data for this week

      const shouldDeleteSurvey = sixWeekData.DeleteSurvey === 'yes';
      const isFinalCollection = sixWeekData.Is_Final_Collection === 'yes';

      return {
        ...cleanedData,
        shouldInsert: !shouldDeleteSurvey && isFinalCollection, // only insert if data is good and final
      };
    }).filter((doc) => !!doc); // remove all nulls
  };

  const data = unpacker(rawData).map(stateToAbbrevTransform);

  // get globalID directly in case we need it below
  const globalID = transformSurvey123GlobalID(rawData.globalid);

  // either use deleteInsert or directly delete the data even if none of it is valid
  const deleteInsertOp = deleteInsert(data) ?? [{ deleteMany: { filter: { globalID } } }];

  const deleteInsertRes = await UnsummarizedTrappingModel.bulkWrite(deleteInsertOp, { ordered: true });

  // run entire pipeline
  // don't throw the error here since we want the webhook to return 200 immediately
  // also don't await it for the same purpose; run pipeline in background
  runPipelineAll().catch(console.log);

  return deleteInsertRes;
};
