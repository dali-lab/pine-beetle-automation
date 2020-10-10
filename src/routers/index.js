import countyPredictionRouter from './county-prediction';
import healthcheck from './healthcheck';
import rdPredictionRouter from './rd-prediction';
import rModel from './r-model';
import unsummarizedTrappingRouter from './unsummarized-trapping';
import spotDataRouter from './spot-data';
import summarizedCountyTrappingRouter from './summarized-county-trapping';
import summarizedRangerDistrictTrappingRouter from './summarized-rangerdistrict-trapping';

export default {
  'county-prediction': countyPredictionRouter,
  healthcheck,
  'r-model': rModel,
  'rd-prediction': rdPredictionRouter,
  'spot-data': spotDataRouter,
  'summarized-county-trapping': summarizedCountyTrappingRouter,
  'summarized-rangerdistrict-trapping': summarizedRangerDistrictTrappingRouter,
  'unsummarized-trapping': unsummarizedTrappingRouter,
};
