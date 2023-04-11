import { newError } from './responses';
import { RESPONSE_TYPES } from '../constants';

/**
 * @description transforms a survey123 globalID to all lowercase and removes curly braces
 * @param {String} rawGlobalID survey123 format of '{ALLCAPSID}'
 */
export const transformSurvey123GlobalID = (rawGlobalID) => rawGlobalID.replace(/(\{|\})/g, '').toLowerCase();

/**
 * @description transforms raw data into a delete operation and 0 or more insert operations for database write
 * @param {Array} sixWeeksData up to 6 weeks of trapping data to add
 */
export const deleteInsert = (sixWeeksData) => {
  if (!sixWeeksData.length) return null;

  const { globalID, shouldInsert } = sixWeeksData.find((d) => !!d) || {};

  if (!globalID) {
    throw newError(
      RESPONSE_TYPES.INTERNAL_ERROR,
      'missing row identifier (globalID) for survey123',
    );
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
