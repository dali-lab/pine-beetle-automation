import ABBREV_TO_STATE from './abbrev-to-state.json';
import CSV_TO_SPOTS from './csv-to-spots.json';
import CSV_TO_UNSUMMARIZED from './csv-to-unsummarized.json';
import RESPONSE_CODES from './response-codes.json';
import RESPONSE_TYPES from './response-types.json';

const STATE_TO_ABBREV = Object.fromEntries(Object.entries(ABBREV_TO_STATE).map(([k, v]) => [v, k]));

const STATE_TO_ABBREV_NOSPACE = Object.fromEntries(Object.entries(ABBREV_TO_STATE).map(([k, v]) => [v.replace(/\s+/g, ''), k]));

const COLLECTION_NAMES = {
  SUMMARIZED: {
    county: 'summarizedcountytrappings',
    rangerDistrict: 'summarizedrangerdistricttrappings',
  },
};

export {
  ABBREV_TO_STATE,
  COLLECTION_NAMES,
  CSV_TO_SPOTS,
  CSV_TO_UNSUMMARIZED,
  STATE_TO_ABBREV,
  STATE_TO_ABBREV_NOSPACE,
  RESPONSE_CODES,
  RESPONSE_TYPES,
};
