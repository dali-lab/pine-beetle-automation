import healthcheck from './healthcheck';
import rModel from './r-model';
import summarizedCountyTrappingRouter from './summarized-county-trapping';
import summarizedRangerDistrictTrappingRouter from './summarized-rangerdistrict-trapping';

export default {
  healthcheck,
  'r-model': rModel,
  'summarized-county-trapping': summarizedCountyTrappingRouter,
  'summarized-rangerdistrict-trapping': summarizedRangerDistrictTrappingRouter,
};
