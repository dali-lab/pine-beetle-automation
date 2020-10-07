import { Router } from 'express';

import {
  RESPONSE_CODES,
  RESPONSE_TYPES,
} from '../constants';

import { generateResponse } from '../utils';
import { rModel } from '../controllers';

const rModelRouter = Router();

rModelRouter.route('/')
  .get(async (req, res) => {
    const {
      cleridst1 = 0,
      endobrev = 0,
      SPB = 0,
      spotst1 = 0,
      spotst2 = 0,
    } = req.query;

    try {
      const result = await rModel.runModel(SPB, cleridst1, spotst1, spotst2, endobrev);
      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      console.log(error);
      res.status(RESPONSE_CODES.INTERNAL_ERROR.status)
        .send(generateResponse(RESPONSE_TYPES.INTERNAL_ERROR, error));
    }
  });

export default rModelRouter;
