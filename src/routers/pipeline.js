import { Router } from 'express';

import { generateResponse, generateErrorResponse } from '../utils';

import { requireAuth } from '../middleware';
import { RESPONSE_TYPES } from '../constants';
import { Pipeline } from '../controllers';

const pipelineRouter = Router();

pipelineRouter.route('/')
  .get(requireAuth, async (_req, res) => {
    try {
      const result = await Pipeline.runPipelineAll();
      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

pipelineRouter.route('/indicator-calculated')
  .get(requireAuth, async (req, res) => {
    try {
      const {
        endYear,
        startYear,
      } = req.query;

      const result = await Pipeline.runIndicatorCalculatorPipelineYears(parseInt(startYear, 10), parseInt(endYear, 10));
      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

export default pipelineRouter;
