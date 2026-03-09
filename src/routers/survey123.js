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

    const filePath = req.file.path;
    try {
      const result = await Survey123.uploadCsv(filePath);
      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, {
        message: 'CSV imported successfully. Pipeline has been started.',
        rowsProcessed: result.rowCount,
        inserted: result.insertRes?.insertedCount ?? 0,
        deleted: result.deleteRes?.deletedCount ?? 0,
      }));
    } catch (err) {
      const errorResponse = generateErrorResponse(err);
      const { error: errorMessage, status } = errorResponse;
      console.error('csv upload failed:', errorMessage);
      res.status(status).send(errorResponse);
    } finally {
      setTimeout(() => deleteFile(filePath), 1000 * 10);
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
