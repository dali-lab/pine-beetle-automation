import crypto from 'crypto';

import { UploadAuditModel } from '../models';

const MAX_AUDIT_ENTRIES_PER_LIST = 1000;

/**
 * @description persists a single upload audit doc. Truncates very long
 * skipped/rejected arrays to keep document size sane.
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
  const truncate = (arr) => (
    Array.isArray(arr) && arr.length > MAX_AUDIT_ENTRIES_PER_LIST
      ? arr.slice(0, MAX_AUDIT_ENTRIES_PER_LIST)
      : (arr || [])
  );

  try {
    await UploadAuditModel.create({
      uploadId: uploadId || crypto.randomUUID(),
      source,
      uploadedBy: uploadedBy || 'admin',
      filename: filename || null,
      totalRows: uploadResult?.rowCount ?? 0,
      acceptedRows: uploadResult?.accepted ?? 0,
      skippedRows: uploadResult?.skipped?.length ?? 0,
      rejectedRows: uploadResult?.rejected?.length ?? 0,
      skipped: truncate(uploadResult?.skipped),
      rejected: truncate(uploadResult?.rejected),
      bulkWriteResult: uploadResult?.bulkWriteResult
        || (uploadResult?.insertRes || uploadResult?.deleteRes
          ? { insertRes: uploadResult.insertRes, deleteRes: uploadResult.deleteRes }
          : null),
      status,
      errorMessage: errorMessage || null,
    });
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
