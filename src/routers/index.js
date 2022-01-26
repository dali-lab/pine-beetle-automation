import countyPredictionRouter from './county-prediction';
import dataDownloadRouter from './data-download';
import healthcheck from './healthcheck';
import pipeline from './pipeline';
import rdPredictionRouter from './rd-prediction';
import rModel from './r-model';
import summarizedCountyTrappingRouter from './summarized-county-trapping';
import summarizedRangerDistrictTrappingRouter from './summarized-rangerdistrict-trapping';
import survey123Router from './survey123';
import unsummarizedTrappingRouter from './unsummarized-trapping';

export default {
  'county-prediction': countyPredictionRouter,
  'data-download': dataDownloadRouter,
  healthcheck,
  pipeline,
  'r-model': rModel,
  'rd-prediction': rdPredictionRouter,
  'summarized-county-trapping': summarizedCountyTrappingRouter,
  'summarized-rangerdistrict-trapping': summarizedRangerDistrictTrappingRouter,
  survey123: survey123Router,
  'unsummarized-trapping': unsummarizedTrappingRouter,
};
