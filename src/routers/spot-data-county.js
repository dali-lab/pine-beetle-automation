import { Router } from 'express';
import multer from 'multer';

import {
  deleteFile,
  generateErrorResponse,
  generateResponse,
} from '../utils';

import { RESPONSE_TYPES } from '../constants';
import { requireAuth } from '../middleware';
import { SpotDataCounty } from '../controllers';

const spotDataCountyRouter = Router();

const upload = multer({ dest: './uploads' });

spotDataCountyRouter.route('/')
  .get(async (_req, res) => { // get all county spot data
    try {
      const documents = await SpotDataCounty.getAll();

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

      const documents = await SpotDataCounty.insertOne(req.body);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, documents));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

spotDataCountyRouter.route('/upload')
  .post(upload.single('csv'), async (req, res) => {
    if (!req.file) {
      res.send(generateResponse(RESPONSE_TYPES.NO_CONTENT, 'missing file'));
      return;
    }

    try {
      await SpotDataCounty.uploadCsv(req.file.path);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, 'file uploaded successfully'));
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

spotDataCountyRouter.route('/download')
  .get(async (req, res) => {
    let filepath;

    try {
      filepath = await SpotDataCounty.downloadCsv(req.query);
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

spotDataCountyRouter.route('/merge/:timescale')
  .get(async (req, res) => {
    try {
      const { timescale } = req.params;
      const { state, year } = req.query;

      if (timescale !== 't0' && timescale !== 't1' && timescale !== 't2') {
        res.send(generateResponse(RESPONSE_TYPES.NO_CONTENT, 'no timescale specified'));
        return;
      }

      if (state && !year) {
        res.send(generateResponse(RESPONSE_TYPES.NO_CONTENT, 'need year for state'));
        return;
      }

      await SpotDataCounty.mergeSpots(timescale, year && parseInt(year, 10), state);

      const message = `merged county spots at timescale ${timescale} at year ${year} for state ${state}`;

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, message));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  });

spotDataCountyRouter.route('/:id')
  .get(async (req, res) => { // get a document by its unique id
    try {
      const documents = await SpotDataCounty.getById(req.params.id);

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

      const documents = await SpotDataCounty.updateById(req.params.id, req.body);

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
      const documents = await SpotDataCounty.deleteById(req.params.id);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, documents));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    }
  }));

export default spotDataCountyRouter;
