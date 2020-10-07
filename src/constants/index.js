import ABBREV_TO_STATE from './abbrev-to-state.json';
import CSV_TO_SPOTS from './csv-to-spots.json';
import CSV_TO_UNSUMMARIZED from './csv-to-unsummarized.json';
import RESPONSE_CODES from './response-codes.json';
import RESPONSE_TYPES from './response-types.json';

const STATE_TO_ABBREV = Object.fromEntries(Object.entries(ABBREV_TO_STATE).map(([k, v]) => [v, k]));

export {
  ABBREV_TO_STATE,
  CSV_TO_SPOTS,
  CSV_TO_UNSUMMARIZED,
  STATE_TO_ABBREV,
  RESPONSE_CODES,
  RESPONSE_TYPES,
};
