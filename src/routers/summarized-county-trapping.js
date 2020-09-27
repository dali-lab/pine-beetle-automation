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
    if (!req.body) {
      res.send(generateResponse(RESPONSE_TYPES.NO_CONTENT, 'empty body'));
      return;
    }
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

      if (result) {
        res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
      } else {
        res.status(RESPONSE_CODES.NOT_FOUND.status)
          .send(generateResponse(RESPONSE_TYPES.NOT_FOUND, 'ID not found'));
      }
    } catch (error) {
      console.log(error);
      res.status(RESPONSE_CODES.INTERNAL_ERROR.status)
        .send(generateResponse(RESPONSE_TYPES.INTERNAL_ERROR, error));
    }
  })

  .put(requireAuth, async (req, res) => {
    const { id } = req.params;

    if (!req.body) {
      res.send(generateResponse(RESPONSE_TYPES.NO_CONTENT, 'empty body'));
      return;
    }
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

      if (result) {
        res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
      } else {
        res.status(RESPONSE_CODES.NOT_FOUND.status)
          .send(generateResponse(RESPONSE_TYPES.NOT_FOUND, 'ID not found'));
      }
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

      if (result) {
        res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
      } else {
        res.status(RESPONSE_CODES.NOT_FOUND.status)
          .send(generateResponse(RESPONSE_TYPES.NOT_FOUND, 'ID not found'));
      }
    } catch (error) {
      console.log(error);
      res.status(RESPONSE_CODES.INTERNAL_ERROR.status)
        .send(generateResponse(RESPONSE_TYPES.INTERNAL_ERROR, error));
    }
  });

export default summarizedCountyTrappingRouter;
