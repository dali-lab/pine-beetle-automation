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
    const {
      state,
      rangerDistrict,
      year,
      spbCount,
      cleridCount,
    } = req.body;

    try {
      const result = await SummarizedRangerDistrictTrapping.insertOne({
        state,
        rangerDistrict,
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

summarizedRangerDistrictTrappingRouter.route('/:id')
  .get(async (req, res) => {
    const { id } = req.params;

    try {
      const result = await SummarizedRangerDistrictTrapping.getById(id);
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
      rangerDistrict,
      year,
      spbCount,
      cleridCount,
    } = req.body;

    try {
      const result = await SummarizedRangerDistrictTrapping.updateById(id, {
        state,
        rangerDistrict,
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
  })

  .delete(requireAuth, async (req, res) => {
    const { id } = req.params;

    try {
      const result = await SummarizedRangerDistrictTrapping.deleteById(id);
      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      console.log(error);
      res.status(RESPONSE_CODES.INTERNAL_ERROR.status)
        .send(generateResponse(RESPONSE_TYPES.INTERNAL_ERROR, error));
    }
  });

summarizedRangerDistrictTrappingRouter.route('/filter')
  .get(async (req, res) => {
    // const {
    //   startYear,
    //   endYear,
    //   state,
    //   rangerDistrict,
    // } = req.query;

    try {
      // to be added
      // const result = await
    } catch (error) {
      console.log(error);
      res.status(RESPONSE_CODES.INTERNAL_ERROR.status)
        .send(generateResponse(RESPONSE_TYPES.INTERNAL_ERROR, error));
    }
  });

export default summarizedRangerDistrictTrappingRouter;
