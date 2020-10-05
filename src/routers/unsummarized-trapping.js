import { Router } from 'express';
import multer from 'multer';

import {
  deleteFile,
  generateErrorResponse,
  generateResponse,
} from '../utils';

import { RESPONSE_TYPES } from '../constants';
import { requireAuth } from '../middleware';
import { UnsummarizedTrapping } from '../controllers';

const unsummarizedTrappingRouter = Router();

const upload = multer({ dest: './uploads' });

unsummarizedTrappingRouter.route('/')
  .get(async (_req, res) => { // get all unsummarized data
    try {
      const documents = await UnsummarizedTrapping.getAll();

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

      const documents = await UnsummarizedTrapping.insertOne(req.body);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, documents));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

unsummarizedTrappingRouter.route('/upload')
  .post(upload.single('csv'), async (req, res) => {
    if (!req.file) {
      res.send(generateResponse(RESPONSE_TYPES.NO_CONTENT, 'missing file'));
      return;
    }

    try {
      await UnsummarizedTrapping.uploadCsv(req.file.path);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, 'file uploaded successfully'));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    } finally {
      await deleteFile(req.file.path);
    }
  });

unsummarizedTrappingRouter.route('/:id')
  .get(async (req, res) => { // get a document by its unique id
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

  .put(requireAuth, async (req, res) => { // modify a document by its unique id
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

  .delete(requireAuth, (async (req, res) => { // delete a document by its unique id
    try {
      const documents = await UnsummarizedTrapping.deleteById(req.params.id);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, documents));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  }));

export default unsummarizedTrappingRouter;
