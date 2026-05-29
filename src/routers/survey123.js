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
import { UploadAuditModel } from '../models';

const upload = multer({ dest: './uploads' });

const survey123Router = Router();

// Map the persisted audit.status to the client-facing /upload/status response.
// 'partial' is preserved distinct from 'success' so the UI can surface that
// some rows were rejected even though the upload completed.
const auditStatusToClientStatus = (auditStatus) => {
  if (auditStatus === 'failed') return 'error';
  return auditStatus; // 'processing' | 'success' | 'partial'
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

    // Persist a 'processing' audit row BEFORE returning 202. The DB is the only
    // source of truth — if the dyno restarts mid-processing, /upload/status can
    // still return 'processing' instead of 404. No in-memory state.
    await persistUploadAudit({
      uploadId,
      source: 'survey123',
      filename: originalFilename,
      status: 'processing',
    });

    // Return 202 immediately to avoid Heroku 30s H12 timeout
    res.status(202).send(generateResponse(RESPONSE_TYPES.SUCCESS, { uploadId }));

    // Process CSV in background
    console.log(`[survey123] starting background upload for ${uploadId}`);
    Survey123.uploadCsv(filePath)
      .then(async (result) => {
        console.log(`[survey123] upload ${uploadId} completed successfully`);
        await persistUploadAudit({
          uploadId,
          source: 'survey123',
          filename: originalFilename,
          uploadResult: result,
          status: deriveUploadStatus(result),
        });
      })
      .catch(async (err) => {
        console.error(`[survey123] upload ${uploadId} FAILED:`, err);
        const errorResponse = generateErrorResponse(err);
        await persistUploadAudit({
          uploadId,
          source: 'survey123',
          filename: originalFilename,
          uploadResult: null,
          status: 'failed',
          errorMessage: errorResponse.error || 'Upload failed',
        });
      })
      .finally(() => {
        setTimeout(() => deleteFile(filePath), 1000 * 10);
      });
  });

survey123Router.route('/upload/status')
  .get(requireAuth, async (req, res) => {
    const uploadId = String(req.query.uploadId || '');

    if (!uploadId) {
      res.status(400).send(generateErrorResponse({
        type: RESPONSE_TYPES.BAD_REQUEST,
        message: 'missing uploadId',
      }));
      return;
    }

    let audit;
    try {
      audit = await UploadAuditModel.findOne({ uploadId }).lean();
    } catch (err) {
      console.error('[survey123] /upload/status DB error:', err);
      res.status(500).send(generateErrorResponse({
        type: RESPONSE_TYPES.INTERNAL_ERROR,
        message: 'Failed to look up upload status',
      }));
      return;
    }

    if (!audit) {
      res.status(404).send(generateErrorResponse({
        type: RESPONSE_TYPES.NOT_FOUND,
        message: 'Upload not found',
      }));
      return;
    }

    res.send(generateResponse(RESPONSE_TYPES.SUCCESS, {
      status: auditStatusToClientStatus(audit.status),
      message: audit.errorMessage || `CSV import ${audit.status}.`,
      result: {
        rowCount: audit.totalRows,
        accepted: audit.acceptedRows,
        skipped: audit.skipped || [],
        rejected: audit.rejected || [],
        truncated: audit.truncated || { skipped: false, rejected: false },
      },
    }));
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
