import { Router } from 'express';

import {
  deleteFile,
  generateErrorResponse,
  generateResponse,
} from '../utils';

import { RESPONSE_TYPES } from '../constants';
import { requireAuth } from '../middleware';
import { RDPrediction } from '../controllers';

const RDPredictionRouter = Router();

RDPredictionRouter.route('/')
  .get(async (_req, res) => {
    try {
      const result = await RDPrediction.getAll();

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  })

  .post(requireAuth, async (req, res) => {
    try {
      if (!Object.keys(req.body).length) {
        res.send(generateResponse(RESPONSE_TYPES.NO_CONTENT, 'empty body'));
        return;
      }

      const result = await RDPrediction.insertOne(req.body);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

RDPredictionRouter.route('/filter')
  .get(async (req, res) => {
    const {
      endYear,
      rangerDistrict,
      startYear,
      state,
    } = req.query;

    try {
      const result = await RDPrediction.getByFilter(startYear, endYear, state, rangerDistrict);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

RDPredictionRouter.route('/download')
  .get(async (_req, res) => {
    let filepath;

    try {
      filepath = await RDPrediction.downloadCsv();
      res.sendFile(filepath);
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    } finally {
      // wrapping in a setTimeout to invoke the event loop, so fs knows the file exists
      setTimeout(() => {
        deleteFile(filepath, true);
      }, 0);
    }
  });

RDPredictionRouter.route('/predict')
  .get(async (req, res) => {
    try {
      const filter = req.query.year ? req.query : { ...req.query, year: parseInt(req.query.year, 10) };

      const data = await RDPrediction.generateAllPredictions(filter);
      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, data));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

RDPredictionRouter.route('/:id')
  .get(async (req, res) => {
    try {
      const { id } = req.params;
      const result = await RDPrediction.getById(id);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  })

  .put(requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      if (!Object.keys(req.body).length) {
        res.send(generateResponse(RESPONSE_TYPES.NO_CONTENT, 'empty body'));
        return;
      }

      const result = await RDPrediction.updateById(id, req.body);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  })

  .delete(requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await RDPrediction.deleteById(id);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

export default RDPredictionRouter;
