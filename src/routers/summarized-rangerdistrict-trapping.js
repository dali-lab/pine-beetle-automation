import { Router } from 'express';
import multer from 'multer';

import {
  deleteFile,
  generateErrorResponse,
  generateResponse,
} from '../utils';

import { RESPONSE_TYPES } from '../constants';
import { requireAuth } from '../middleware';
import { SummarizedRangerDistrictTrapping, Pipeline } from '../controllers';

const summarizedRangerDistrictTrappingRouter = Router();

const upload = multer({ dest: './uploads' });

summarizedRangerDistrictTrappingRouter.route('/')
  .get(async (_req, res) => {
    try {
      const result = await SummarizedRangerDistrictTrapping.getAll();

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

      const result = await SummarizedRangerDistrictTrapping.insertOne(req.body);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

summarizedRangerDistrictTrappingRouter.route('/aggregate')
  .get(requireAuth, async (req, res) => {
    try {
      const { state, year } = req.query;
      if (state && year) {
        await SummarizedRangerDistrictTrapping.summarizeStateYear(state, parseInt(year, 10));
      } else {
        await SummarizedRangerDistrictTrapping.summarizeAll();
      }

      const message = state && year
        ? `summarized by ranger district on ${state} for ${year}`
        : 'summarized all by ranger district';

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, message));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
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
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

summarizedRangerDistrictTrappingRouter.route('/upload')
  .post(requireAuth, upload.single('csv'), async (req, res) => {
    if (!req.file) {
      res.send(generateResponse(RESPONSE_TYPES.NO_CONTENT, 'missing file'));
      return;
    }

    try {
      const uploadResult = await SummarizedRangerDistrictTrapping.uploadCsv(req.file.path);
      Pipeline.runPipelineAll();

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, {
        data: uploadResult,
        message: 'file uploaded successfully',
      }));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    } finally {
      // wrapping in a setTimeout to invoke the event loop, so fs knows the file exists
      setTimeout(() => {
        deleteFile(req.file.path);
      }, 1000 * 10);
    }
  });

summarizedRangerDistrictTrappingRouter.route('/download')
  .get(async (req, res) => {
    let filepath;

    try {
      filepath = await SummarizedRangerDistrictTrapping.downloadCsv(req.query);

      res.attachment('rangerdistrict-summarized.csv').sendFile(filepath);
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    } finally {
      // wrapping in a setTimeout to invoke the event loop, so fs knows the file exists
      setTimeout(() => {
        deleteFile(filepath, true);
      }, 1000 * 10);
    }
  });

summarizedRangerDistrictTrappingRouter.route('/:id')
  .get(async (req, res) => {
    try {
      const { id } = req.params;
      const result = await SummarizedRangerDistrictTrapping.getById(id);

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

      const result = await SummarizedRangerDistrictTrapping.updateById(id, req.body);

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
      const result = await SummarizedRangerDistrictTrapping.deleteById(id);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

export default summarizedRangerDistrictTrappingRouter;
