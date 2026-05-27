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

      const filter = {};
      if (req.query.status) filter.status = req.query.status;
      if (req.query.source) filter.source = req.query.source;

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

      res.send(generateResponse(RESPONSE_TYPES.SUCCESS, {
        data,
        pagination: {
          page, limit, total, totalPages: Math.ceil(total / limit),
        },
      }));
    } catch (error) {
      const errorResponse = generateErrorResponse(error);
      const { error: errorMessage, status } = errorResponse;
      console.log(errorMessage);
      res.status(status).send(errorResponse);
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
