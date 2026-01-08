import { Router } from 'express';

import {
  generateErrorResponse,
  generateResponse,
} from '../utils';

import { RESPONSE_TYPES } from '../constants';
import { UnsummarizedTrapping } from '../controllers';
import { requireAuth } from '../middleware';

const unsummarizedTrappingRouter = Router();

unsummarizedTrappingRouter.route('/')
  .get(async (req, res) => {
    try {
      const { page, limit } = req.query;
      const result = await UnsummarizedTrapping.getAll(page, limit);

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

      const documents = await UnsummarizedTrapping.insertOne(req.body);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, documents));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  })

  .delete(requireAuth, async (req, res) => {
    try {
      const documents = await UnsummarizedTrapping.deleteAll();

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, documents));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

unsummarizedTrappingRouter.route('/filter')
  .get(async (req, res) => {
    const {
      county,
      endYear,
      rangerDistrict,
      startYear,
      state,
      page,
      limit,
    } = req.query;

    try {
      const result = await UnsummarizedTrapping.getByFilter(
        startYear,
        endYear,
        state,
        county,
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

unsummarizedTrappingRouter.route('/download')
  .get(async (req, res) => {
    try {
      await UnsummarizedTrapping.downloadCsvStream(req.query, res);
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

unsummarizedTrappingRouter.route('/:id')
  .get(async (req, res) => {
    try {
      const documents = await UnsummarizedTrapping.getById(req.params.id);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, documents));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  })

  .put(requireAuth, async (req, res) => {
    try {
      if (!Object.keys(req.body).length) {
        res.send(generateResponse(RESPONSE_TYPES.NO_CONTENT, 'empty body'));
        return;
      }

      const documents = await UnsummarizedTrapping.updateById(req.params.id, req.body);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, documents));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  })

  .delete(requireAuth, async (req, res) => {
    try {
      const documents = await UnsummarizedTrapping.deleteById(req.params.id);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, documents));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

export default unsummarizedTrappingRouter;
