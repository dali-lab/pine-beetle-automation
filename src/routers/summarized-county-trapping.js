import { Router } from 'express';

import {
  generateResponse,
  RESPONSE_CODES,
  RESPONSE_TYPES,
} from '../constants';

import { requireAuth } from '../middleware';
import { SummarizedCountyTrapping } from '../controllers';

const summarizedCountyTrappingRouter = Router();

summarizedCountyTrappingRouter.route('/')
  .get(async (_req, res) => {
    try {
      const result = await SummarizedCountyTrapping.getAll();
      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      console.log(error);
      res.status(RESPONSE_CODES.INTERNAL_ERROR.status)
        .send(generateResponse(RESPONSE_TYPES.INTERNAL_ERROR, error));
    }
  })

  .post(requireAuth, async (req, res) => {
    const {
      state,
      county,
      year,
      spbCount,
      cleridCount,
    } = req.body;

    try {
      const result = await SummarizedCountyTrapping.insertOne({
        state,
        county,
        year,
        spbCount,
        cleridCount,
      });
      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      console.log(error);
      res.status(RESPONSE_CODES.INTERNAL_ERROR.status)
        .send(generateResponse(RESPONSE_TYPES.INTERNAL_ERROR, error));
    }
  });

summarizedCountyTrappingRouter.route('/filter')
  .get(async (req, res) => {
    const {
      startYear,
      endYear,
      state,
      county,
    } = req.query;

    try {
      const result = await SummarizedCountyTrapping.getByFilter(startYear, endYear, state, county);
      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      console.log(error);
      res.status(RESPONSE_CODES.INTERNAL_ERROR.status)
        .send(generateResponse(RESPONSE_TYPES.INTERNAL_ERROR, error));
    }
  });

summarizedCountyTrappingRouter.route('/:id')
  .get(async (req, res) => {
    const { id } = req.params;

    try {
      const result = await SummarizedCountyTrapping.getById(id);
      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      console.log(error);
      res.status(RESPONSE_CODES.INTERNAL_ERROR.status)
        .send(generateResponse(RESPONSE_TYPES.INTERNAL_ERROR, error));
    }
  })

  .put(requireAuth, async (req, res) => {
    const { id } = req.params;
    const {
      state,
      county,
      year,
      spbCount,
      cleridCount,
    } = req.body;

    try {
      const result = await SummarizedCountyTrapping.updateById(id, {
        state,
        county,
        year,
        spbCount,
        cleridCount,
      });
      res.send(generateResponse(
        result ? RESPONSE_TYPES.SUCCESS : RESPONSE_TYPES.NO_CONTENT,
        result,
      ));
    } catch (error) {
      console.log(error);
      res.status(RESPONSE_CODES.INTERNAL_ERROR.status)
        .send(generateResponse(RESPONSE_TYPES.INTERNAL_ERROR, error));
    }
  })

  .delete(requireAuth, async (req, res) => {
    const { id } = req.params;

    try {
      const result = await SummarizedCountyTrapping.deleteById(id);
      res.send(generateResponse(
        result ? RESPONSE_TYPES.SUCCESS : RESPONSE_TYPES.NO_CONTENT,
        result,
      ));
    } catch (error) {
      console.log(error);
      res.status(RESPONSE_CODES.INTERNAL_ERROR.status)
        .send(generateResponse(RESPONSE_TYPES.INTERNAL_ERROR, error));
    }
  });

export default summarizedCountyTrappingRouter;
