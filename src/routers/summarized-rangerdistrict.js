import { Router } from 'express';
import multer from 'multer';

import {
  deleteFile,
  generateErrorResponse,
  generateResponse,
} from '../utils';

import { RESPONSE_TYPES } from '../constants';
import { requireAuth } from '../middleware';
import { SummarizedRangerDistrict, Pipeline } from '../controllers';

const summarizedRangerDistrictRouter = Router();

const upload = multer({ dest: './uploads' });

summarizedRangerDistrictRouter.route('/')
  .get(async (req, res) => {
    try {
      const { page, limit } = req.query;
      const result = await SummarizedRangerDistrict.getAll(page, limit);

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

      const result = await SummarizedRangerDistrict.insertOne(req.body);

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
      const result = await SummarizedRangerDistrict.deleteAll();

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

summarizedRangerDistrictRouter.route('/filter')
  .get(async (req, res) => {
    const {
      endYear,
      rangerDistrict,
      startYear,
      state,
      page,
      limit,
    } = req.query;

    try {
      const result = await SummarizedRangerDistrict.getByFilter(
        startYear,
        endYear,
        state,
        rangerDistrict,
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

summarizedRangerDistrictRouter.route('/spots/upload')
  .post(requireAuth, upload.single('csv'), async (req, res) => {
    if (!req.file) {
      res.send(generateResponse(RESPONSE_TYPES.NO_CONTENT, 'missing file'));
      return;
    }

    try {
      const uploadResult = await SummarizedRangerDistrict.uploadSpotsCsv(req.file.path);
      Pipeline.runPipelineAll().catch((err) => console.error('Pipeline failed after upload:', err));

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

summarizedRangerDistrictRouter.route('/upload')
  .post(requireAuth, upload.single('csv'), async (req, res) => {
    if (!req.file) {
      res.send(generateResponse(RESPONSE_TYPES.NO_CONTENT, 'missing file'));
      return;
    }

    try {
      const uploadResult = await SummarizedRangerDistrict.uploadCsv(req.file.path);
      Pipeline.runPipelineAll().catch((err) => console.error('Pipeline failed after upload:', err));

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

summarizedRangerDistrictRouter.route('/download')
  .get(async (req, res) => {
    try {
      await SummarizedRangerDistrict.downloadCsvStream(req.query, res);
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

summarizedRangerDistrictRouter.route('/download-predict')
  .get(async (req, res) => {
    let filepath;

    try {
      filepath = await SummarizedRangerDistrict.downloadPredictionCsv(req.query);

      res.attachment('rangerdistrict-prediction.csv').sendFile(filepath);
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

summarizedRangerDistrictRouter.route('/:id')
  .get(async (req, res) => {
    try {
      const { id } = req.params;
      const result = await SummarizedRangerDistrict.getById(id);

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

      const result = await SummarizedRangerDistrict.updateById(id, req.body);

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
      const result = await SummarizedRangerDistrict.deleteById(id);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

export default summarizedRangerDistrictRouter;
