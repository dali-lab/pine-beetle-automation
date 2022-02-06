import ABBREV_TO_STATE from './abbrev-to-state.json';
import RESPONSE_CODES from './response-codes.json';
import RESPONSE_TYPES from './response-types.json';

const STATE_TO_ABBREV = Object.fromEntries(Object.entries(ABBREV_TO_STATE).map(([k, v]) => [v, k]));
const STATE_TO_ABBREV_NOSPACE = Object.fromEntries(Object.entries(ABBREV_TO_STATE).map(([k, v]) => [v.replace(/\s+/g, ''), k]));

const STATE_TO_ABBREV_COMBINED = {
  ...STATE_TO_ABBREV,
  ...STATE_TO_ABBREV_NOSPACE,
};

const COLLECTION_NAMES = {
  SUMMARIZED_COUNTY: 'summarizedcounties',
  SUMMARIZED_RANGERDISTRICT: 'summarizedrangerdistricts',
  UNSUMMARIZED: 'unsummarizedtrappings',
};

export {
  ABBREV_TO_STATE,
  COLLECTION_NAMES,
  RESPONSE_CODES,
  RESPONSE_TYPES,
  STATE_TO_ABBREV_COMBINED,
  STATE_TO_ABBREV_NOSPACE,
  STATE_TO_ABBREV,
};
