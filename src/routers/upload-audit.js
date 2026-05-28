import { Router } from 'express';

import { UploadAuditModel } from '../models';
import { requireAuth } from '../middleware';
import { RESPONSE_TYPES } from '../constants';
import { generateErrorResponse, generateResponse } from '../utils';

const uploadAuditRouter = Router();

// list — paginated, latest first; optional ?status=partial|failed|success and ?source=...
uploadAuditRouter.route('/')
  .get(requireAuth, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
      const skip = (page - 1) * limit;

      // Coerce query params to strings + allowlist status to avoid Mongo
      // operator injection (e.g. ?status[$ne]=...). Reject array-valued or
      // unknown filters with 400 — silently dropping them would return the
      // full unfiltered set, which the caller did not ask for.
      const ALLOWED_STATUS = ['processing', 'success', 'partial', 'failed'];
      const filter = {};
      if (req.query.status !== undefined) {
        if (typeof req.query.status !== 'string' || !ALLOWED_STATUS.includes(req.query.status)) {
          return res.status(400).send(generateErrorResponse({
            type: RESPONSE_TYPES.BAD_REQUEST,
            message: `Invalid status filter. Allowed: ${ALLOWED_STATUS.join(', ')}`,
          }));
        }
        filter.status = req.query.status;
      }
      if (req.query.source !== undefined) {
        if (typeof req.query.source !== 'string') {
          return res.status(400).send(generateErrorResponse({
            type: RESPONSE_TYPES.BAD_REQUEST,
            message: 'Invalid source filter',
          }));
        }
        filter.source = req.query.source;
      }

      const [data, total] = await Promise.all([
        UploadAuditModel.find(filter)
          .sort({ uploadedAt: -1 })
          .skip(skip)
          .limit(limit)
          .select('-skipped -rejected') // exclude heavy arrays from list view
          .lean()
          .exec(),
        UploadAuditModel.countDocuments(filter),
      ]);

      return res.send(generateResponse(RESPONSE_TYPES.SUCCESS, {
        data,
        pagination: {
          page, limit, total, totalPages: Math.ceil(total / limit),
        },
      }));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      return res.status(status).send(errorResponse);
    }
  });

// detail — full doc including skipped + rejected arrays
uploadAuditRouter.route('/:uploadId')
  .get(requireAuth, async (req, res) => {
    try {
      const doc = await UploadAuditModel.findOne({ uploadId: req.params.uploadId }).lean();
      if (!doc) {
        return res.status(404).send(generateResponse(RESPONSE_TYPES.NOT_FOUND, 'audit entry not found'));
      }
      return res.send(generateResponse(RESPONSE_TYPES.SUCCESS, doc));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      return res.status(status).send(errorResponse);
    }
  });

export default uploadAuditRouter;
