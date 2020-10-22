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

    const input = [{
      cleridst1: parseInt(cleridst1, 10),
      endobrev: parseInt(endobrev, 10),
      SPB: parseInt(SPB, 10),
      spotst1: parseInt(spotst1, 10),
      spotst2: parseInt(spotst2, 10),
    }];

    console.log(input);

    try {
      const result = await rModel.runModel(input);
      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      console.log(error);
      res.status(RESPONSE_CODES.INTERNAL_ERROR.status)
        .send(generateResponse(RESPONSE_TYPES.INTERNAL_ERROR, error));
    }
  });

// rModelRouter.route('/test')
//   .get(async (req, res) => {
//     const array = [{
//       cleridst1: 29.666666666666668,
//       endobrev: 0,
//       SPB: 0.000000001,
//       spotst1: 0,
//       spotst2: 0,
//     }, {
//       cleridst1: 38.5,
//       endobrev: 0,
//       SPB: 0.18182,
//       spotst1: 0.5,
//       spotst2: 0.5,
//     }];
//
//     try {
//       const result = await rModel.runTableModel(array);
//       res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
//     } catch (error) {
//       console.log(error);
//       res.status(RESPONSE_CODES.INTERNAL_ERROR.status)
//         .send(generateResponse(RESPONSE_TYPES.INTERNAL_ERROR, error));
//     }
//   });

export default rModelRouter;
