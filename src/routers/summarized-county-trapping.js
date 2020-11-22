import { Router } from 'express';
import multer from 'multer';

import {
  deleteFile,
  generateErrorResponse,
  generateResponse,
} from '../utils';

import { RESPONSE_TYPES } from '../constants';
import { requireAuth } from '../middleware';
import { SummarizedCountyTrapping } from '../controllers';

const summarizedCountyTrappingRouter = Router();

const upload = multer({ dest: './uploads' });

summarizedCountyTrappingRouter.route('/')
  .get(async (_req, res) => {
    try {
      const result = await SummarizedCountyTrapping.getAll();

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

      const result = await SummarizedCountyTrapping.insertOne(req.body);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

summarizedCountyTrappingRouter.route('/filter')
  .get(async (req, res) => {
    const {
      county,
      endYear,
      startYear,
      state,
    } = req.query;

    try {
      const result = await SummarizedCountyTrapping.getByFilter(startYear, endYear, state, county);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

summarizedCountyTrappingRouter.route('/aggregate')
  .get(async (req, res) => {
    try {
      const { state, year } = req.query;
      if (state && year) {
        await SummarizedCountyTrapping.summarizeStateYear(state, parseInt(year, 10));
      } else {
        await SummarizedCountyTrapping.summarizeAll();
      }

      const message = state && year
        ? `summarized by county on ${state} for ${year}`
        : 'summarized all by county';

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, message));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

summarizedCountyTrappingRouter.route('/upload')
  .post(upload.single('csv'), async (req, res) => {
    if (!req.file) {
      res.send(generateResponse(RESPONSE_TYPES.NO_CONTENT, 'missing file'));
      return;
    }

    try {
      const uploadResult = await SummarizedCountyTrapping.uploadCsv(req.file.path);

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
      }, 0);
    }
  });

summarizedCountyTrappingRouter.route('/download')
  .get(async (req, res) => {
    let filepath;

    try {
      filepath = await SummarizedCountyTrapping.downloadCsv(req.query);
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

summarizedCountyTrappingRouter.route('/:id')
  .get(async (req, res) => {
    try {
      const { id } = req.params;
      const result = await SummarizedCountyTrapping.getById(id);

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

      const result = await SummarizedCountyTrapping.updateById(id, req.body);

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
      const result = await SummarizedCountyTrapping.deleteById(id);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

export default summarizedCountyTrappingRouter;
