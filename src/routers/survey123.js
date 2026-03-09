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

    // Always process in background: return 202 immediately to avoid Heroku 30s H12 timeout.
    // Upload + pipeline can take longer than 30s for larger files.
    res.status(202).send(generateResponse(RESPONSE_TYPES.SUCCESS, {
      message: 'Upload accepted, processing in background. Pipeline will run after data is saved.',
    }));

    const filePath = req.file.path;
    setImmediate(() => {
      Survey123.uploadCsv(filePath)
        .then(() => console.log('csv upload completed successfully'))
        .catch((err) => console.error('csv upload failed:', err))
        .finally(() => deleteFile(filePath));
    });
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
