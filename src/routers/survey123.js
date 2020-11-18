import { Router } from 'express';
import multer from 'multer';

import {
  deleteFile,
  generateErrorResponse,
  generateResponse,
} from '../utils';

import { RESPONSE_TYPES } from '../constants';

import {
  // UnsummarizedTrapping,
  Survey123,
} from '../controllers';

const upload = multer({ dest: './uploads' });

const survey123Router = Router();

survey123Router.route('/upload')
  .post(upload.single('csv'), async (req, res) => {
    if (!req.file) {
      res.send(generateResponse(RESPONSE_TYPES.NO_CONTENT, 'missing file'));
      return;
    }

    try {
      await Survey123.uploadCsv(req.file.path);
      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, 'file uploaded successfully'));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    } finally {
      // TODO: this isn't working for some reason for long uploads
      // wrapping in a setTimeout to invoke the event loop, so fs knows the file exists
      setTimeout(() => {
        deleteFile(req.file.path);
      }, 0);
    }
  });

survey123Router.route('/new')
  .post(async (req, res) => {
    const {
      feature: {
        attributes,
      },
    } = req.body;

    await Survey123.uploadSurvey123FromWebhook(attributes);
    res.send(generateResponse(RESPONSE_TYPES.SUCCESS));
  });

survey123Router.route('/edit')
  .post(async (_req, res) => {
    // TODO: implement this
    res.send(generateResponse(RESPONSE_TYPES.SUCCESS));
  });

export default survey123Router;
