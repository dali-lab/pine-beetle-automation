import { Router } from 'express';
import multer from 'multer';

import {
  deleteFile,
  generateErrorResponse,
  generateResponse,
} from '../utils';

import { requireAuth } from '../middleware';

import { RESPONSE_TYPES } from '../constants';

import { Survey123 } from '../controllers';

const upload = multer({ dest: './uploads' });

const survey123Router = Router();

survey123Router.route('/upload')
  .post(requireAuth, upload.single('csv'), async (req, res) => {
    if (!req.file) {
      res.send(generateResponse(RESPONSE_TYPES.NO_CONTENT, 'missing file'));
      return;
    }

    try {
      const uploadResult = await Survey123.uploadCsv(req.file.path);

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, {
        data: uploadResult,
        message: 'file uploaded successfully',
      }));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.error(errorMessage);
      res.status(status).send(errorResponse);
    } finally {
      // wrapping in a setTimeout to invoke the event loop, so fs knows the file exists
      setTimeout(() => {
        deleteFile(req.file.path);
      }, 1000 * 10);
    }
  });

survey123Router.route('/webhook')
  .post(async (req, res) => {
    const {
      feature: {
        attributes,
      },
    } = req.body;

    try {
      await Survey123.uploadSurvey123FromWebhook(attributes);
      res.send(generateResponse(RESPONSE_TYPES.SUCCESS));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.error(errorMessage);
      console.error(attributes);
      res.status(status).send(errorResponse);
    }
  });

export default survey123Router;
