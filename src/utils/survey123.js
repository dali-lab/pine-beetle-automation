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
    // want to check if '0' or 0 so only doing double equals
    // eslint-disable-next-line eqeqeq
    if (!cleanedData.collectionDate || cleanedData.daysActive == '0') return undefined; // no data for this week

    return cleanedData;
  }).filter((doc) => !!doc); // remove all nulls
};

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

  const {
    county, rangerDistrict, state, year,
  } = sixWeeksData[0];

  if (!(year && state && (county || rangerDistrict))) {
    throw newError(RESPONSE_TYPES.INTERNAL_ERROR,
      'missing row identifier (year, state, county, or ranger district) for survey123');
  }

  const insertOps = sixWeeksData.map((weekData) => ({
    insertOne: {
      document: weekData,
    },
  }));

  return [
    {
      deleteMany: { // first clear out all with same year, state, county, rd
        filter: {
          county,
          rangerDistrict,
          state,
          year,
        },
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
          docs.push(transform ? unpackedData.map(transform) : unpackedData);
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
