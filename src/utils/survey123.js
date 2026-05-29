import { RESPONSE_TYPES } from '../constants';
import { newError } from './responses';

// Active-days bounds for a survey (sum across 6 weeks).
// Lower bound 12: anything below is too short to be a real survey.
// Upper bound 90 covers full 6-week spring surveys spanning ~Mar-May (typically 60-70 days).
export const MIN_DAYS_ACTIVE = 12;
export const MAX_DAYS_ACTIVE = 90;

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

  const insertOps = shouldInsert && numDaysActive >= MIN_DAYS_ACTIVE && numDaysActive <= MAX_DAYS_ACTIVE
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
