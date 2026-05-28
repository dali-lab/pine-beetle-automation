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
  MAX_DAYS_ACTIVE,
  MIN_DAYS_ACTIVE,
  processCSV,
  transformSurvey123GlobalID,
  tryCastDate,
  tryCastNumber,
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

// Skip/reject reason codes — used in audit log + frontend display
export const SURVEY123_REASONS = {
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  MISSING_FORMAT_FIELD: 'MISSING_FORMAT_FIELD',
  ROW_PROCESSING_ERROR: 'ROW_PROCESSING_ERROR',
  MISSING_COLLECTION_DATE: 'MISSING_COLLECTION_DATE',
  ZERO_DAYS_ACTIVE: 'ZERO_DAYS_ACTIVE',
  MARKED_DELETE: 'MARKED_DELETE',
  NOT_FINAL_COLLECTION: 'NOT_FINAL_COLLECTION',
  ACTIVE_DAYS_OUT_OF_RANGE: 'ACTIVE_DAYS_OUT_OF_RANGE',
  INVALID_NUMERIC: 'INVALID_NUMERIC',
  INVALID_DATE: 'INVALID_DATE',
};

// Fields that mongoose will cast to Number / Date at bulkWrite time —
// pre-validate them in preview so CastError-class failures are surfaced.
const NUMERIC_FIELDS = ['spbCount', 'cleridCount', 'daysActive', 'latitude', 'longitude', 'year', 'endobrev', 'FIPS'];
const DATE_FIELDS = ['collectionDate', 'startDate', 'bloomDate'];

const validateCastable = (cleanedData, identifier, rowNumber, rejected) => {
  let bad = false;
  NUMERIC_FIELDS.forEach((field) => {
    const raw = cleanedData[field];
    if (raw === undefined || raw === null || raw === '') return;
    if (!tryCastNumber(raw).ok) {
      rejected.push({
        rowNumber,
        identifier,
        reason: SURVEY123_REASONS.INVALID_NUMERIC,
        field,
        value: String(raw),
      });
      bad = true;
    }
  });
  DATE_FIELDS.forEach((field) => {
    const raw = cleanedData[field];
    if (raw === undefined || raw === null || raw === '') return;
    if (!tryCastDate(raw).ok) {
      rejected.push({
        rowNumber,
        identifier,
        reason: SURVEY123_REASONS.INVALID_DATE,
        field,
        value: String(raw),
      });
      bad = true;
    }
  });
  return !bad;
};

const buildIdentifier = (row, rowNumber) => {
  const state = row.USA_State || row.State || '?';
  const county = row.County || row['County/Parish'] || '?';
  const year = row.Year || '?';
  const trap = row.Trap_name || row['Trap name'] || '?';
  return `row ${rowNumber} / ${state} / ${county} / ${year} / ${trap}`;
};

/**
 * @description parses + validates a survey123 CSV without writing to DB.
 * Returns docs ready for commit, plus structured skipped/rejected lists.
 * @param {String} filename the csv filename on disk
 */
export const parseSurvey123Csv = async (filename) => {
  const skipped = [];
  const rejected = [];

  const unpacker = (sixWeekData, rowNumber) => {
    const isNewFormat = sixWeekData.USA_State !== undefined;
    const identifier = buildIdentifier(sixWeekData, rowNumber);

    return ordinalStrings.map(([weekNum, weekOrdinal]) => {
      const convertedRawData = isNewFormat ? {
        bloom: sixWeekData.Species_Bloom,
        bloomDate: sixWeekData.Initial_Bloom,
        cleridCount: sixWeekData[`Number_Clerids${weekNum}`],
        collectionDate: sixWeekData[`CollectionDate${weekNum}`],
        county: sixWeekData.County,
        daysActive: sixWeekData[`TrappingInterval${weekNum}`],
        endobrev: 1,
        FIPS: null,
        globalID: transformSurvey123GlobalID(sixWeekData.globalid || sixWeekData.GlobalID),
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
      } : {
        bloom: sixWeekData['What bloomed?'],
        bloomDate: sixWeekData['Date of Inital bloom'],
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

      const deleteField = isNewFormat ? 'DeleteSurvey' : 'Delete this survey?';
      const missingFields = [deleteField, 'Is_Final_Collection'].filter((field) => sixWeekData[field] === undefined);
      if (missingFields.length > 0) {
        throw newError(RESPONSE_TYPES.BAD_REQUEST, `missing fields: ${missingFields}`);
      }

      const shouldDeleteSurvey = sixWeekData[deleteField] === 'yes';
      const isFinalCollection = sixWeekData.Is_Final_Collection === 'yes';
      const shouldInsert = !shouldDeleteSurvey && isFinalCollection;

      if (!cleanedData.collectionDate) {
        skipped.push({
          rowNumber, identifier: `${identifier} / week ${weekNum}`, reason: SURVEY123_REASONS.MISSING_COLLECTION_DATE,
        });
        return undefined;
      }
      if (!cleanedData.daysActive || cleanedData.daysActive === '0') {
        skipped.push({
          rowNumber, identifier: `${identifier} / week ${weekNum}`, reason: SURVEY123_REASONS.ZERO_DAYS_ACTIVE,
        });
        return undefined;
      }

      // numeric/date cast checks — only block insertion. For delete-marked rows we still
      // want the deleteMany to fire even if old data has garbage numerics that triggered
      // the user to delete the survey in the first place.
      if (shouldInsert) {
        // Required key fields cannot be blank — mongoose's global '' → 0 cast (for year)
        // and '' → null cast (for state) would otherwise silently corrupt the row.
        const missingKeys = ['state', 'year'].filter((f) => (
          cleanedData[f] === undefined || cleanedData[f] === null || cleanedData[f] === ''
        ));
        if (missingKeys.length > 0) {
          rejected.push({
            rowNumber,
            identifier: `${identifier} / week ${weekNum}`,
            reason: SURVEY123_REASONS.MISSING_REQUIRED_FIELD,
            field: missingKeys.join(','),
          });
          return undefined;
        }

        const castOk = validateCastable(cleanedData, `${identifier} / week ${weekNum}`, rowNumber, rejected);
        if (!castOk) return undefined;
      }

      if (shouldDeleteSurvey) {
        skipped.push({
          rowNumber, identifier: `${identifier} / week ${weekNum}`, reason: SURVEY123_REASONS.MARKED_DELETE,
        });
      } else if (!isFinalCollection) {
        skipped.push({
          rowNumber, identifier: `${identifier} / week ${weekNum}`, reason: SURVEY123_REASONS.NOT_FINAL_COLLECTION,
        });
      }

      return {
        ...cleanedData,
        shouldInsert,
      };
    }).filter((doc) => !!doc);
  };

  const { docs, rowCount, rejections } = await processCSV(filename, (row, rowNumber) => ({
    rowNumber,
    weeks: unpacker(row, rowNumber).map(stateToAbbrevTransform),
  }), { collectErrors: true });

  rejections.forEach(({ rowNumber, error, raw }) => {
    rejected.push({
      rowNumber,
      identifier: buildIdentifier(raw, rowNumber),
      reason: error?.message?.startsWith('missing fields')
        ? SURVEY123_REASONS.MISSING_REQUIRED_FIELD
        : SURVEY123_REASONS.ROW_PROCESSING_ERROR,
      field: error?.message || '',
    });
  });

  // build bulk operations from valid docs, but additionally surface deleteInsert-level
  // rejections (e.g. active-days out of range) so the user sees why a survey was dropped.
  // When a survey is rejected for being out-of-range, skip the deleteInsert entirely —
  // otherwise we would issue a deleteMany with no replacement inserts and silently wipe
  // existing data for that globalID.
  const bulkOpGroups = docs.map(({ rowNumber, weeks }) => {
    if (!weeks.length) return [];
    const numDaysActive = weeks.reduce((acc, curr) => (
      acc + (parseInt(curr.daysActive, 10) || 0)
    ), 0);
    const { shouldInsert } = weeks.find((d) => !!d) || {};
    if (shouldInsert && (numDaysActive < MIN_DAYS_ACTIVE || numDaysActive > MAX_DAYS_ACTIVE)) {
      const first = weeks[0] || {};
      rejected.push({
        rowNumber,
        identifier: `row ${rowNumber} / ${first.state || '?'} / ${first.county || '?'} / ${first.year || '?'} / ${first.trap || '?'}`,
        reason: SURVEY123_REASONS.ACTIVE_DAYS_OUT_OF_RANGE,
        field: 'daysActive',
        value: `${numDaysActive} (allowed ${MIN_DAYS_ACTIVE}-${MAX_DAYS_ACTIVE})`,
      });
      return [];
    }
    return deleteInsert(weeks) || [];
  });

  const bulkOp = bulkOpGroups.flat().filter((obj) => !!obj);
  const insertOp = bulkOp.filter(({ insertOne }) => !!insertOne);
  const deleteOp = bulkOp.filter(({ deleteMany }) => !!deleteMany);

  return {
    rowCount,
    bulkOp,
    insertOp,
    deleteOp,
    skipped,
    rejected,
    accepted: insertOp.length,
  };
};

/**
 * @description uploads a csv to the unsummarized collection
 * @param {String} filename the csv filename on disk
 * @param {Object} [options]
 * @param {Boolean} [options.dryRun=false] when true, parse + validate only; do not write to DB
 */
export const uploadCsv = async (filename, options = {}) => {
  const { dryRun = false } = options;

  const parsed = await parseSurvey123Csv(filename);
  const {
    rowCount, bulkOp, insertOp, deleteOp, skipped, rejected, accepted,
  } = parsed;

  if (dryRun) {
    return {
      rowCount,
      accepted,
      willDelete: deleteOp.length,
      skippedRows: skipped.length,
      rejectedRows: rejected.length,
      skipped,
      rejected,
      deleteRes: { deletedCount: 0 },
      insertRes: { insertedCount: 0 },
    };
  }

  // No valid operations to perform — return the parsed diagnostics instead of
  // throwing so the audit log and /upload/status surface the per-row skip/reject
  // reasons rather than a bare 'no valid data' error.
  if (!bulkOp.length) {
    return {
      rowCount,
      accepted: 0,
      willDelete: 0,
      skippedRows: skipped.length,
      rejectedRows: rejected.length,
      skipped,
      rejected,
      deleteRes: { deletedCount: 0 },
      insertRes: { insertedCount: 0 },
    };
  }

  const deleteRes = deleteOp.length
    ? await UnsummarizedTrappingModel.bulkWrite(deleteOp, { ordered: false })
    : { deletedCount: 0 };
  const insertRes = insertOp.length
    ? await UnsummarizedTrappingModel.bulkWrite(insertOp, { ordered: false })
    : { insertedCount: 0 };

  runPipelineAll().catch(console.error);

  return {
    rowCount,
    accepted,
    willDelete: deleteOp.length,
    skippedRows: skipped.length,
    rejectedRows: rejected.length,
    skipped,
    rejected,
    deleteRes,
    insertRes,
  };
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
      // the webhook format can either be checked in ngrok/server logs,
      // or you can login to http://gfcgis.maps.arcgis.com and head to the Pine Beetle dashboard there,
      // and then download csv from there to see the column names.
      const convertedRawData = {
        bloom: sixWeekData.Species_Bloom,
        bloomDate: sixWeekData.Initial_Bloom,
        cleridCount: sixWeekData[`Number_Clerids${weekNum}`],
        collectionDate: sixWeekData[`CollectionDate${weekNum}`] ?? null, // explicitly give null default value due to survey123 bug
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

      // will throw error if missing fields
      // if sixWeekData[`CollectionDate{weekNum}`] was undefined due to the survey123 bug, this will NOT throw...
      const cleanedData = extractModelAttributes(convertedRawData);

      // copied from utils/extractObjectFieldsCreator
      const missingFields = ['DeleteSurvey', 'Is_Final_Collection'].filter((field) => sixWeekData[field] === undefined);
      if (missingFields.length > 0) {
        throw newError(RESPONSE_TYPES.BAD_REQUEST, `missing fields: ${missingFields}`);
      }

      // if sixWeekData[`CollectionDate{weekNum}`] was undefined due to the survey123 bug, this will return here indicating 'missing week data'
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
  // don't throw the error here since we want to return 200 immediately
  // also don't await it for the same purpose; run pipeline in background
  runPipelineAll().catch(console.error);

  return deleteInsertRes;
};
