import { Router } from 'express';

import { generateResponse, generateErrorResponse } from '../utils';

import { requireAuth } from '../middleware';
import { RESPONSE_TYPES } from '../constants';
import { Pipeline } from '../controllers';

const pipelineRouter = Router();

pipelineRouter.route('/')
  .get(requireAuth, async (req, res) => {
    const { state, year } = req.query;
    let result;

    try {
      if (state && year) {
        result = await Pipeline.runPipelineStateYear(state, year);
      } else {
        result = await Pipeline.runPipelineAll();
      }

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

export default pipelineRouter;
