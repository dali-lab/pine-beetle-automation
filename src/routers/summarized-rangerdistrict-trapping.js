import { Router } from 'express';

import {
  generateResponse,
  RESPONSE_CODES,
  RESPONSE_TYPES,
} from '../constants';

import { requireAuth } from '../middleware';
import { SummarizedRangerDistrictTrapping } from '../controllers';

const summarizedRangerDistrictTrappingRouter = Router();

summarizedRangerDistrictTrappingRouter.route('/')
  .get(async (_req, res) => {
    try {
      const result = await SummarizedRangerDistrictTrapping.getAll();
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
      cleridCount,
      rangerDistrict,
      spbCount,
      state,
      year,
    } = req.body;

    try {
      const result = await SummarizedRangerDistrictTrapping.insertOne({
        cleridCount,
        rangerDistrict,
        spbCount,
        state,
        year,
      });
      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      console.log(error);
      res.status(RESPONSE_CODES.INTERNAL_ERROR.status)
        .send(generateResponse(RESPONSE_TYPES.INTERNAL_ERROR, error));
    }
  });

summarizedRangerDistrictTrappingRouter.route('/filter')
  .get(async (req, res) => {
    const {
      endYear,
      rangerDistrict,
      startYear,
      state,
    } = req.query;

    try {
      const result = await SummarizedRangerDistrictTrapping.getByFilter(startYear, endYear, state, rangerDistrict);
      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      console.log(error);
      res.status(RESPONSE_CODES.INTERNAL_ERROR.status)
        .send(generateResponse(RESPONSE_TYPES.INTERNAL_ERROR, error));
    }
  });

summarizedRangerDistrictTrappingRouter.route('/:id')
  .get(async (req, res) => {
    const { id } = req.params;

    try {
      const result = await SummarizedRangerDistrictTrapping.getById(id);

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
      cleridCount,
      rangerDistrict,
      spbCount,
      state,
      year,
    } = req.body;

    try {
      const result = await SummarizedRangerDistrictTrapping.updateById(id, {
        cleridCount,
        rangerDistrict,
        spbCount,
        state,
        year,
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
      const result = await SummarizedRangerDistrictTrapping.deleteById(id);

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

export default summarizedRangerDistrictTrappingRouter;
