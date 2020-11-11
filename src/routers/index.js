import countyPredictionRouter from './county-prediction';
import healthcheck from './healthcheck';
import rModel from './r-model';
import rdPredictionRouter from './rd-prediction';
import spotDataRouter from './spot-data';
import summarizedCountyTrappingRouter from './summarized-county-trapping';
import summarizedRangerDistrictTrappingRouter from './summarized-rangerdistrict-trapping';
import survey123Router from './survey123';
import unsummarizedTrappingRouter from './unsummarized-trapping';

export default {
  'county-prediction': countyPredictionRouter,
  healthcheck,
  'r-model': rModel,
  'rd-prediction': rdPredictionRouter,
  'spot-data': spotDataRouter,
  'summarized-county-trapping': summarizedCountyTrappingRouter,
  'summarized-rangerdistrict-trapping': summarizedRangerDistrictTrappingRouter,
  survey123: survey123Router,
  'unsummarized-trapping': unsummarizedTrappingRouter,
};
