import { Router } from 'express';

import {
  generateResponse,
  RESPONSE_TYPES,
} from '../constants';

import { rModel } from '../controllers';

const rModelRouter = Router();

rModelRouter.route('/')
  .get(async (req, res) => {
    const {
      SPB = 0,
      cleridst1 = 0,
      spotst1 = 0,
      spotst2 = 0,
      endobrev = 0,
    } = req.query;

    try {
      const result = await rModel.default(SPB, cleridst1, spotst1, spotst2, endobrev);
      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      console.log(error);
      res.send(generateResponse(RESPONSE_TYPES.INTERNAL_ERROR, error));
    }
  });

export default rModelRouter;
