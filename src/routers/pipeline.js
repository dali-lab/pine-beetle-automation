import { Router } from 'express';

import { RESPONSE_TYPES } from '../constants';
import { generateResponse, generateErrorResponse } from '../utils';

import { Pipeline } from '../controllers';

const pipelineRouter = Router();

pipelineRouter.route('/')
  .get(async (req, res) => {
    const { state, year } = req.query;

    try {
      if (state && year) await Pipeline.runPipelineStateYear(state, year);
      else await Pipeline.runPipelineAll();

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

export default pipelineRouter;
