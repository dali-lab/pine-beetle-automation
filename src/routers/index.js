import healthcheck from './healthcheck';
import rModel from './r-model';
import unsummarizedTrappingRouter from './unsummarized-trapping';
import spotDataRouter from './spot-data';
import summarizedCountyTrappingRouter from './summarized-county-trapping';
import summarizedRangerDistrictTrappingRouter from './summarized-rangerdistrict-trapping';

export default {
  healthcheck,
  'r-model': rModel,
  'spot-data': spotDataRouter,
  'summarized-county-trapping': summarizedCountyTrappingRouter,
  'summarized-rangerdistrict-trapping': summarizedRangerDistrictTrappingRouter,
  'unsummarized-trapping': unsummarizedTrappingRouter,
};
