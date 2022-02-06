import { Router } from 'express';

import { RESPONSE_TYPES } from '../constants';

import {
  generateErrorResponse,
  generateResponse,
} from '../utils';

import { rModel } from '../controllers';

const rModelRouter = Router();

rModelRouter.route('/')
  .get(async (req, res) => {
    const {
      cleridst1,
      endobrev = 0,
      SPB = 0,
      spotst1 = 0,
      spotst2 = 0,
    } = req.query;

    const input = [{
      cleridst1: cleridst1 ? parseFloat(cleridst1, 10) : null,
      endobrev: parseInt(endobrev, 10),
      SPB: parseFloat(SPB, 10),
      spotst1: parseInt(spotst1, 10),
      spotst2: parseInt(spotst2, 10),
    }];

    try {
      const result = await rModel.runModel(input);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result[0]));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

rModelRouter.route('/calculated-fields')
  .get(async (req, res) => {
    const {
      cleridsPer2Weeks,
      probSpotsGT50,
      spbPer2Weeks,
      spotst0,
    } = req.query;

    const input = [{
      cleridsPer2Weeks: parseFloat(cleridsPer2Weeks, 10),
      probSpotsGT50: parseFloat(probSpotsGT50, 10),
      spbPer2Weeks: parseFloat(spbPer2Weeks, 10),
      spotst0: parseFloat(spotst0, 10),
    }];

    try {
      const result = await rModel.generateCalculatedFields(input);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result[0]));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

export default rModelRouter;
