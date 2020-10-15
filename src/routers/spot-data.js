import { Router } from 'express';
import multer from 'multer';

import {
  deleteFile,
  generateErrorResponse,
  generateResponse,
} from '../utils';

import { RESPONSE_TYPES } from '../constants';
import { requireAuth } from '../middleware';
import { SpotData } from '../controllers';

const spotDataRouter = Router();

const upload = multer({ dest: './uploads' });

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

spotDataRouter.route('/upload')
  .post(upload.single('csv'), async (req, res) => {
    if (!req.file) {
      res.send(generateResponse(RESPONSE_TYPES.NO_CONTENT, 'missing file'));
      return;
    }

    try {
      await SpotData.uploadCsv(req.file.path);

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

spotDataRouter.route('/download')
  .get(async (_req, res) => {
    let filepath;

    try {
      filepath = await SpotData.downloadCsv();
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

spotDataRouter.route('/merge/:location')
  .get(async (req, res) => {
    try {
      const { location } = req.params;
      const { year } = req.query;

      if (location === 'county') {
        if (year) await SpotData.mergeCountyYear(parseInt(year, 10));
        else await SpotData.mergeCounty();
      } else if (location === 'rangerDistrict') {
        if (year) await SpotData.mergeRangerDistrictYear(parseInt(year, 10));
        else await SpotData.mergeRangerDistrict();
      } else {
        res.send(generateResponse(RESPONSE_TYPES.NO_CONTENT, 'no location specified'));
        return;
      }

      const message = year
        ? `merged spots by ${location} for ${year}`
        : `merged all spots by ${location}`;

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, message));
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
