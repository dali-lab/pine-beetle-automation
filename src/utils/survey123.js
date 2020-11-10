/* eslint-disable import/prefer-default-export */
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
    if (!cleanedData.collectionDate || cleanedData.daysActive === '0') return undefined; // no data for this week

    return cleanedData;
  }).filter((doc) => !!doc); // remove all nulls
};

export const deleteInsert = (sixWeeksData) => {
  if (!sixWeeksData.length) return null;

  const { globalID } = sixWeeksData[0];

  if (!globalID) throw newError(RESPONSE_TYPES.INTERNAL_ERROR, 'missing globalID for survey123');

  const insertOps = sixWeeksData.map((weekData) => ({
    insertOne: {
      document: weekData,
    },
  }));

  return [
    {
      deleteMany: { // first clear out all with same globalID
        filter: { globalID },
      },
    },
    ...insertOps, // then insert new ones
  ];
};

export const csvUploadSurvey123Creator = (ModelName, cleanCsv, cleanBody, transform) => async (filename) => {
  const filepath = path.resolve(__dirname, `../../${filename}`);

  const docs = [];

  const unpacker = survey123UnpackCreator(cleanCsv, cleanBody);

  return new Promise((resolve, reject) => {
    parseFile(filepath, { headers: true })
      .on('data', (data) => {
        try {
          // attempt to unpack all weeks 1-6 and push all
          const unpackedData = unpacker(data);
          // apply transformation if it exists
          const dataToAdd = transform ? unpackedData.map(transform) : unpackedData;
          docs.push(dataToAdd);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (err) => reject(err))
      .on('end', (rowCount) => {
        const { deletes: deleteOp, inserts: insertOp } = docs.reduce(({ deletes, inserts }, currDoc) => {
          const ops = deleteInsert(currDoc);
          if (!ops) return { deletes, inserts };

          const [oneDelete, ...manyInserts] = ops;

          return {
            deletes: [...deletes, oneDelete],
            inserts: [...inserts, ...manyInserts],
          };
        }, { deletes: [], inserts: [] });
        // this currently doesn't work :( because our unique indexes are broken
        // // apply flatmap transformation to delete and reinsert, also remove nulls
        // const deleteInsertOp = docs.flatMap(deleteInsert).filter((doc) => !!doc);
        ModelName.bulkWrite(deleteOp, { ordered: false })
          .then((deleteRes) => {
            return ModelName.bulkWrite(insertOp, { ordered: false })
              .then((insertRes) => [deleteRes, insertRes]);
          })
          .then((res) => {
            console.log(`successfully parsed ${rowCount} rows from csv upload`);
            resolve(res);
          })
          .catch((err) => reject(err));
      });
  });
};

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
        if (filter && filter(cleanedData)) {
          // apply transform
          const doc = transform ? transform(cleanedData) : cleanedData;
          inserts.push(doc);

          const {
            county, rangerDistrict, state, year,
          } = doc;

          deletions.push({
            county,
            rangerDistrict,
            state,
            year,
          });
        }
      })
      .on('error', (err) => reject(err))
      .on('end', (rowCount) => {
        const insertOp = inserts.map((document) => ({
          insertOne: {
            document,
          },
        }));

        const deleteOp = deletions.map(({
          county, rangerDistrict, state, year,
        }) => ({
          // clear out by county, rd, state, year
          deleteMany: {
            filter: {
              county,
              rangerDistrict,
              state,
              year,
            },
          },
        }));

        ModelName.bulkWrite(deleteOp, { ordered: false })
          .then((deleteRes) => {
            return ModelName.bulkWrite(insertOp, { ordered: false })
              .then((insertRes) => [deleteRes, insertRes]);
          })
          .then((res) => {
            console.log(`successfully parsed ${rowCount} rows from csv upload`);
            resolve(res);
          })
          .catch((err) => reject(err));
      });
  });
};
