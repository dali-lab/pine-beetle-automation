import { Router } from 'express';
import multer from 'multer';

import {
  deleteFile,
  generateErrorResponse,
  generateResponse,
} from '../utils';

import { RESPONSE_TYPES } from '../constants';
import { requireAuth } from '../middleware';
import { SummarizedCounty, Pipeline } from '../controllers';

const summarizedCountyRouter = Router();

const upload = multer({ dest: './uploads' });

summarizedCountyRouter.route('/')
  .get(async (req, res) => {
    try {
      const { page, limit } = req.query;
      const result = await SummarizedCounty.getAll(page, limit);

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

      const result = await SummarizedCounty.insertOne(req.body);

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
      const result = await SummarizedCounty.deleteAll();

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

summarizedCountyRouter.route('/filter')
  .get(async (req, res) => {
    const {
      county,
      endYear,
      startYear,
      state,
      page,
      limit,
    } = req.query;

    try {
      const result = await SummarizedCounty.getByFilter(
        startYear,
        endYear,
        state,
        county,
        page,
        limit,
      );

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

summarizedCountyRouter.route('/spots/upload')
  .post(requireAuth, upload.single('csv'), async (req, res) => {
    if (!req.file) {
      res.send(generateResponse(RESPONSE_TYPES.NO_CONTENT, 'missing file'));
      return;
    }

    try {
      const uploadResult = await SummarizedCounty.uploadSpotsCsv(req.file.path);
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

summarizedCountyRouter.route('/upload')
  .post(requireAuth, upload.single('csv'), async (req, res) => {
    if (!req.file) {
      res.send(generateResponse(RESPONSE_TYPES.NO_CONTENT, 'missing file'));
      return;
    }

    try {
      const uploadResult = await SummarizedCounty.uploadCsv(req.file.path);
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

summarizedCountyRouter.route('/download')
  .get(async (req, res) => {
    try {
      await SummarizedCounty.downloadCsvStream(req.query, res);
      // Response jest już wysłany przez stream
    } catch (error) {
      if (!res.headersSent) {
        const errorResponse = generateErrorResponse(error);
        const { error: errorMessage, status } = errorResponse;
        console.log(errorMessage);
        res.status(status).send(errorResponse);
      } else {
        console.error('Error after streaming started:', error);
      }
    }
  });

summarizedCountyRouter.route('/download-predict')
  .get(async (req, res) => {
    let filepath;

    try {
      filepath = await SummarizedCounty.downloadPredictionCsv(req.query);

      res.attachment('county-prediction.csv').sendFile(filepath);
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

summarizedCountyRouter.route('/:id')
  .get(async (req, res) => {
    try {
      const { id } = req.params;
      const result = await SummarizedCounty.getById(id);

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

      const result = await SummarizedCounty.updateById(id, req.body);

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
      const result = await SummarizedCounty.deleteById(id);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

export default summarizedCountyRouter;
