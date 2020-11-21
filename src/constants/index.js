import ABBREV_TO_STATE from './abbrev-to-state.json';
import CSV_TO_SPOTS_COUNTY from './csv-to-spots-county.json';
import CSV_TO_SPOTS_RANGER_DISTRICT from './csv-to-spots-rangerdistrict.json';
import CSV_TO_UNSUMMARIZED from './csv-to-unsummarized.json';
import STATE_NATIONAL_FOREST_RANGER_DISTRICT_NAME_MAPPING from './state-nf-rd-mapping.json';
import STATE_RANGER_DISTRICT_NAME_MAPPING from './state-nf-mapping.json';
import RANGER_DISTRICT_NAME_MAPPING from './rd-name-mapping.json';
import RESPONSE_CODES from './response-codes.json';
import RESPONSE_TYPES from './response-types.json';

const STATE_TO_ABBREV = Object.fromEntries(Object.entries(ABBREV_TO_STATE).map(([k, v]) => [v, k]));

const STATE_TO_ABBREV_NOSPACE = Object.fromEntries(Object.entries(ABBREV_TO_STATE).map(([k, v]) => [v.replace(/\s+/g, ''), k]));

const STATE_TO_ABBREV_COMBINED = {
  ...STATE_TO_ABBREV,
  ...STATE_TO_ABBREV_NOSPACE,
};

const COLLECTION_NAMES = {
  SUMMARIZED: {
    county: 'summarizedcountytrappings',
    rangerDistrict: 'summarizedrangerdistricttrappings',
  },
};

export {
  ABBREV_TO_STATE,
  COLLECTION_NAMES,
  CSV_TO_SPOTS_COUNTY,
  CSV_TO_SPOTS_RANGER_DISTRICT,
  CSV_TO_UNSUMMARIZED,
  STATE_NATIONAL_FOREST_RANGER_DISTRICT_NAME_MAPPING,
  STATE_RANGER_DISTRICT_NAME_MAPPING,
  RANGER_DISTRICT_NAME_MAPPING,
  RESPONSE_CODES,
  RESPONSE_TYPES,
  STATE_TO_ABBREV_COMBINED,
  STATE_TO_ABBREV_NOSPACE,
  STATE_TO_ABBREV,
};
