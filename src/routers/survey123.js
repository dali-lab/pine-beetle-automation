import crypto from 'crypto';
import { Router } from 'express';
import multer from 'multer';

import {
  deleteFile,
  deriveUploadStatus,
  generateErrorResponse,
  generateResponse,
  persistUploadAudit,
} from '../utils';

import { requireAuth } from '../middleware';

import { RESPONSE_TYPES } from '../constants';

import { Survey123 } from '../controllers';

const upload = multer({ dest: './uploads' });

const survey123Router = Router();

// In-memory store for async upload statuses
const uploadStatuses = new Map();

// Clean up completed statuses after 30 minutes
const STATUS_TTL_MS = 30 * 60 * 1000;
const cleanupStatus = (uploadId) => {
  setTimeout(() => uploadStatuses.delete(uploadId), STATUS_TTL_MS);
};

survey123Router.route('/upload/preview')
  .post(requireAuth, upload.single('csv'), async (req, res) => {
    if (!req.file) {
      res.send(generateResponse(RESPONSE_TYPES.NO_CONTENT, 'missing file'));
      return;
    }
    const filePath = req.file.path;
    try {
      const result = await Survey123.uploadCsv(filePath, { dryRun: true });
      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, result));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
    } finally {
      setTimeout(() => deleteFile(filePath), 1000 * 10);
    }
  });

survey123Router.route('/upload')
  .post(requireAuth, upload.single('csv'), async (req, res) => {
    if (!req.file) {
      res.send(generateResponse(RESPONSE_TYPES.NO_CONTENT, 'missing file'));
      return;
    }

    const filePath = req.file.path;
    const originalFilename = req.file.originalname;
    const uploadId = crypto.randomUUID();

    uploadStatuses.set(uploadId, { status: 'processing' });

    // Return 202 immediately to avoid Heroku 30s H12 timeout
    res.status(202).send(generateResponse(RESPONSE_TYPES.SUCCESS, { uploadId }));

    // Process CSV in background
    console.log(`[survey123] starting background upload for ${uploadId}`);
    Survey123.uploadCsv(filePath)
      .then(async (result) => {
        console.log(`[survey123] upload ${uploadId} completed successfully`);
        const auditStatus = deriveUploadStatus(result);
        uploadStatuses.set(uploadId, {
          status: auditStatus === 'failed' ? 'error' : 'success',
          message: `CSV imported. ${result.rowCount} rows parsed, ${result.accepted} accepted, ${result.skipped.length} skipped, ${result.rejected.length} rejected. Pipeline started.`,
          result,
        });
        await persistUploadAudit({
          uploadId,
          source: 'survey123',
          filename: originalFilename,
          uploadResult: result,
          status: auditStatus,
        });
        cleanupStatus(uploadId);
      })
      .catch(async (err) => {
        console.error(`[survey123] upload ${uploadId} FAILED:`, err);
        const errorResponse = generateErrorResponse(err);
        uploadStatuses.set(uploadId, {
          status: 'error',
          message: errorResponse.error || 'Upload failed',
        });
        await persistUploadAudit({
          uploadId,
          source: 'survey123',
          filename: originalFilename,
          uploadResult: null,
          status: 'failed',
          errorMessage: errorResponse.error || 'Upload failed',
        });
        cleanupStatus(uploadId);
      })
      .finally(() => {
        setTimeout(() => deleteFile(filePath), 1000 * 10);
      });
  });

survey123Router.route('/upload/status')
  .get(requireAuth, (req, res) => {
    const { uploadId } = req.query;

    if (!uploadId) {
      res.status(400).send(generateErrorResponse({
        type: RESPONSE_TYPES.BAD_REQUEST,
        message: 'missing uploadId',
      }));
      return;
    }

    const statusData = uploadStatuses.get(uploadId);

    if (!statusData) {
      res.status(404).send(generateErrorResponse({
        type: RESPONSE_TYPES.NOT_FOUND,
        message: 'Upload not found or expired',
      }));
      return;
    }

    res.send(generateResponse(RESPONSE_TYPES.SUCCESS, statusData));
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
