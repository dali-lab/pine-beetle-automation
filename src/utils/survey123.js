import path from 'path';
import { parseFile } from 'fast-csv';

import { newError } from './responses';
import { RESPONSE_TYPES } from '../constants';

const ordinals = {
  1: '1st',
  2: '2nd',
  3: '3rd',
  4: '4th',
  5: '5th',
  6: '6th',
};

const ordinalStrings = Object.entries(ordinals);

/**
 * transform a survey123 globalID to all lowercase and remove curly braces
 * @param {String} rawGlobalID s123 format of '{ALLCAPSID}'
 */
export const transformSurvey123GlobalID = (rawGlobalID) => rawGlobalID.replace(/(\{|\})/g, '').toLowerCase();

/**
 * partially applied function creating an unpacker that takes 6 weeks of data and returns
 * up to 6 rows of single-week data in canonical form (FROM WEBHOOK)
 * @param {Function} cleanJson transformation from csv/json attribute names to our schema
 * @param {Function} cleanBody ensures that all model fields are filled
 * @returns {(sixWeekData: Object) => Array} the function that unpacks the data
 */
export const survey123WebhookUnpackCreator = (cleanJson, cleanBody) => (sixWeekData) => {
  return ordinalStrings.map(([weekNum]) => {
    // cast everything to the unrolled schema in our 2011-2017 csv format
    // so we can leverage the same cleanCsv (and that works on json too)
    const convertedRawData = {
      'Active Trapping Days': sixWeekData[`TrappingInterval${weekNum}`],
      Clerid: sixWeekData[`Number_Clerids${weekNum}`],
      'County/Parish': sixWeekData.County,
      'Date of Collection': sixWeekData[`CollectionDate${weekNum}`],
      'Date of initial bloom': sixWeekData.Initial_Bloom,
      endobrev: 1,
      FIPS: null,
      GlobalID: transformSurvey123GlobalID(sixWeekData.globalid), // transform into regular form
      'National Forest (Ranger District)': sixWeekData.Nat_Forest_Ranger_Dist,
      Season: sixWeekData.Season,
      sirexLure: 'Y',
      SPB: sixWeekData[`Number_SPB${weekNum}`],
      State: sixWeekData.USA_State,
      'Trap Lure': sixWeekData.Trap_Lure,
      'Trap Name': sixWeekData.Trap_name,
      'Traps set out on:': sixWeekData.TrapSetDate,
      'What bloomed?': sixWeekData.Species_Bloom,
      x: sixWeekData.Longitude,
      y: sixWeekData.Latitude,
      Year: sixWeekData.Year,
    };

    const cleanedData = cleanBody(cleanJson(convertedRawData));

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

/**
* partially applied function creating an unpacker that takes 6 weeks of data and returns
* up to 6 rows of single-week data in canonical form (FROM CSV)
* @param {Function} cleanCsvOrJson transformation from csv/json attribute names to our schema
* @param {Function} cleanBody ensures that all model fields are filled
* @returns {(sixWeekData: Object) => Array} the function that unpacks the data
*/
export const survey123UnpackCreator = (cleanCsvOrJson, cleanBody) => (sixWeekData) => {
  return ordinalStrings.map(([weekNum, weekOrdinal]) => {
    // cast everything to the unrolled schema in our 2011-2017 csv format
    // so we can leverage the same cleanCsv (and that works on json too)
    const convertedRawData = {
      ...sixWeekData,
      'Active Trapping Days': sixWeekData[`Active Trapping Days (${weekOrdinal} Collection)`],
      Clerid: sixWeekData[`Number Clerids (${weekOrdinal} Collection)`],
      'Date of Collection': sixWeekData[`Date of Collection ${weekNum}`],
      'Date of initial bloom': sixWeekData['Date of Inital bloom'], // fix spelling
      endobrev: 1,
      FIPS: null,
      sirexLure: 'Y',
      SPB: sixWeekData[`Number SPB (${weekOrdinal} Collection)`],
      'Trap Name': sixWeekData['Trap name'],
    };

    const cleanedData = cleanBody(cleanCsvOrJson(convertedRawData));

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

/**
 * transforms raw data into a delete operation and 0 or more insert operations for database write
 * @param {Array} sixWeeksData up to 6 weeks of trapping data to add
 */
export const deleteInsert = (sixWeeksData) => {
  if (!sixWeeksData.length) return null;

  const { globalID, shouldInsert } = sixWeeksData.find((d) => !!d) || {};

  if (!globalID) {
    throw newError(RESPONSE_TYPES.INTERNAL_ERROR,
      'missing row identifier (globalID) for survey123');
  }

  const numDaysActive = sixWeeksData.reduce((acc, curr) => (
    acc + (parseInt(curr.daysActive, 10) || 0)
  ), 0);

  // only insert if data is valid and between 12 and 60 days total active
  const insertOps = shouldInsert && numDaysActive >= 12 && numDaysActive <= 60
    ? sixWeeksData.map((weekData) => ({
      insertOne: {
        document: weekData,
      },
    }))
    : [];

  return [
    {
      deleteMany: { // first clear out all with same globalid
        filter: { globalID },
      },
    },
    ...insertOps, // then insert new ones
  ];
};

/**
* higher-order function that creates a csv uploader function for survey123-style data
* @param {mongoose.Model} ModelName destination Model of upload
* @param {function} cleanCsv function to cast csv to model schema
* @param {function} cleanBody function to validate that all model schema parameters are present
* @param {function} filter optional parameter to conditionally accept documents
* @param {function} transform optional parameter to modify a document before insertion
* @returns {(filename: String) => Promise}
* @throws RESPONSE_TYPES.BAD_REQUEST for missing fields
* @throws other errors depending on what went wrong
 */
export const csvUploadSurvey123Creator = (ModelName, cleanCsv, cleanBody, filter, transform) => async (filename) => {
  const filepath = path.resolve(__dirname, `../../${filename}`);

  const docs = [];

  const unpacker = survey123UnpackCreator(cleanCsv, cleanBody);

  return new Promise((resolve, reject) => {
    parseFile(filepath, { headers: true })
      .on('data', (data) => {
        try {
          // attempt to unpack all weeks 1-6 and push all
          const unpackedData = unpacker(data);

          // apply filter if it exists
          if (!filter || filter(unpackedData)) {
            // apply transformation if it exists
            docs.push(transform ? unpackedData.map(transform) : unpackedData);
          }
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (err) => reject(err))
      .on('end', (rowCount) => {
        // spread out the operation into sequential deletes and inserts
        const bulkOp = docs.flatMap(deleteInsert).filter((obj) => !!obj);

        const insertOp = bulkOp.filter(({ insertOne }) => !!insertOne);
        const deleteOp = bulkOp.filter(({ deleteMany }) => !!deleteMany);

        ModelName.bulkWrite(deleteOp, { ordered: false })
          .then((deleteRes) => {
            return ModelName.bulkWrite(insertOp, { ordered: false })
              .then((insertRes) => [deleteRes, insertRes]);
          })
          .then((bothRes) => {
            console.log(`successfully parsed ${rowCount} rows from csv upload`);
            resolve(bothRes);
          })
          .catch((err) => reject(err));
      });
  });
};

/**
* @description higher-order function that creates a csv uploader function for unsummarized data
* @param {mongoose.Model} ModelName destination Model of upload
* @param {function} cleanCsv function to cast csv to model schema
* @param {function} cleanBody function to validate that all model schema parameters are present
* @param {function} filter optional parameter to conditionally accept documents
* @param {function} transform optional parameter to modify a document before insertion
* @param {string} filename csv filename on disk
* @returns {(filename: String) => Promise}
* @throws RESPONSE_TYPES.BAD_REQUEST for missing fields
* @throws other errors depending on what went wrong
*/
export const unsummarizedDataCsvUploadCreator = (ModelName, cleanCsv, cleanBody, filter, transform) => async (filename) => {
  const filepath = path.resolve(__dirname, `../../${filename}`);

  const inserts = [];
  const deletions = [];

  return new Promise((resolve, reject) => {
    parseFile(filepath, { headers: true })
      .on('data', (data) => {
        // cast the csv fields to our schema
        const cleanedData = cleanBody(cleanCsv(data));
        if (!cleanedData) reject(newError(RESPONSE_TYPES.BAD_REQUEST, 'missing fields in csv'));

        // apply filter
        if (!filter || filter(cleanedData)) {
          // apply transform
          const doc = transform ? transform(cleanedData) : cleanedData;
          inserts.push(doc);

          const { globalID } = doc;
          deletions.push({ globalID });
        }
      })
      .on('error', (err) => reject(err))
      .on('end', (rowCount) => {
        const insertOp = inserts.map((document) => ({
          insertOne: {
            document,
          },
        }));

        // clear out by globalID
        const deleteOp = deletions.map(({ globalID }) => ({
          deleteMany: {
            filter: { globalID },
          },
        }));

        ModelName.bulkWrite(deleteOp, { ordered: false })
          .then((deleteRes) => {
            return ModelName.bulkWrite(insertOp, { ordered: false })
              .then((insertRes) => [deleteRes, insertRes]);
          })
          .then((bothRes) => {
            console.log(`successfully parsed ${rowCount} rows from csv upload`);
            resolve(bothRes);
          })
          .catch((err) => reject(err));
      });
  });
};
