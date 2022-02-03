import healthcheck from './healthcheck';
import pipeline from './pipeline';
import rModel from './r-model';
import summarizedCountyRouter from './summarized-county';
import summarizedRangerDistrictRouter from './summarized-rangerdistrict';
import survey123Router from './survey123';
import unsummarizedTrappingRouter from './unsummarized-trapping';

export default {
  healthcheck,
  pipeline,
  'r-model': rModel,
  'summarized-county': summarizedCountyRouter,
  'summarized-rangerdistrict': summarizedRangerDistrictRouter,
  survey123: survey123Router,
  'unsummarized-trapping': unsummarizedTrappingRouter,
};
