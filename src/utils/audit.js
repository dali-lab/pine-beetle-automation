import crypto from 'crypto';

import { UploadAuditModel } from '../models';

const MAX_AUDIT_ENTRIES_PER_LIST = 1000;

/**
 * @description upserts an upload audit doc by uploadId. Safe to call multiple
 * times for the same uploadId — first call (status='processing') creates the
 * row before the work starts, subsequent calls update it with the final result.
 * This means async uploads always have a persisted audit row, even if the
 * dyno restarts mid-processing.
 *
 * Truncates very long skipped/rejected arrays to keep document size sane and
 * sets `truncated.{skipped,rejected}` so the UI can flag incomplete lists.
 *
 * TODO(#14 follow-up): uploadedBy currently defaults to 'admin' because
 * requireAuth middleware does not attach req.user. Backend /v3/user/auth must
 * return user info and the middleware must propagate it onto req before this
 * field is meaningful. Tracked separately so the data-corruption fixes in this
 * PR can ship without a cross-repo change.
 */
export const persistUploadAudit = async ({
  uploadId,
  source,
  uploadedBy,
  filename,
  uploadResult,
  status,
  errorMessage,
}) => {
  const skippedArr = Array.isArray(uploadResult?.skipped) ? uploadResult.skipped : [];
  const rejectedArr = Array.isArray(uploadResult?.rejected) ? uploadResult.rejected : [];
  const truncate = (arr) => (arr.length > MAX_AUDIT_ENTRIES_PER_LIST
    ? arr.slice(0, MAX_AUDIT_ENTRIES_PER_LIST)
    : arr);

  // Only set row-data fields when we actually have a result. At upload start
  // (status='processing'), uploadResult is undefined and we want the schema
  // defaults to apply rather than overwriting any existing row with zeros.
  const update = {
    source,
    uploadedBy: uploadedBy || 'admin',
    filename: filename || null,
    status,
    errorMessage: errorMessage || null,
  };

  if (uploadResult) {
    update.totalRows = uploadResult.rowCount ?? 0;
    update.acceptedRows = uploadResult.accepted ?? 0;
    update.skippedRows = skippedArr.length;
    update.rejectedRows = rejectedArr.length;
    update.skipped = truncate(skippedArr);
    update.rejected = truncate(rejectedArr);
    update.truncated = {
      skipped: skippedArr.length > MAX_AUDIT_ENTRIES_PER_LIST,
      rejected: rejectedArr.length > MAX_AUDIT_ENTRIES_PER_LIST,
    };
    update.bulkWriteResult = uploadResult.bulkWriteResult
      || (uploadResult.insertRes || uploadResult.deleteRes
        ? { insertRes: uploadResult.insertRes, deleteRes: uploadResult.deleteRes }
        : null);
  }

  try {
    await UploadAuditModel.findOneAndUpdate(
      { uploadId: uploadId || crypto.randomUUID() },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  } catch (err) {
    // audit logging must never break the actual upload
    console.error('[upload-audit] failed to persist audit doc:', err);
  }
};

/**
 * @description derives status from upload result counts
 */
export const deriveUploadStatus = (uploadResult) => {
  const rejected = uploadResult?.rejected?.length ?? 0;
  const accepted = uploadResult?.accepted ?? 0;
  if (rejected > 0 && accepted > 0) return 'partial';
  if (rejected > 0 && accepted === 0) return 'failed';
  return 'success';
};
