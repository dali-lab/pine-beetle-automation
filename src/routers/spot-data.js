import { Router } from 'express';

import {
  generateErrorResponse,
  generateResponse,
} from '../utils';

import { RESPONSE_TYPES } from '../constants';
import { SpotData } from '../controllers';
import { requireAuth } from '../middleware';

const spotDataRouter = Router();

spotDataRouter.route('/')
  .get(async (_req, res) => { // get all spot data
    try {
      const documents = await SpotData.getAll();

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, documents));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  })

  .post(requireAuth, async (req, res) => { // add a new document to collection
    try {
      if (!Object.keys(req.body).length) {
        res.send(generateResponse(RESPONSE_TYPES.NO_CONTENT, 'empty body'));
        return;
      }

      const documents = await SpotData.insertOne(req.body);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, documents));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

spotDataRouter.route('/:id')
  .get(async (req, res) => { // get a document by its unique id
    try {
      const documents = await SpotData.getById(req.params.id);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, documents));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  })

  .put(requireAuth, async (req, res) => { // modify a document by its unique id
    try {
      if (!Object.keys(req.body).length) {
        res.send(generateResponse(RESPONSE_TYPES.NO_CONTENT, 'empty body'));
        return;
      }

      const documents = await SpotData.updateById(req.params.id, req.body);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, documents));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  })

  .delete(requireAuth, (async (req, res) => { // delete a document by its unique id
    try {
      const documents = await SpotData.deleteById(req.params.id);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, documents));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  }));

export default spotDataRouter;
