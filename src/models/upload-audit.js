/* eslint-disable sort-keys */
import mongoose, { Schema } from 'mongoose';

// per-row rejection/skip entry — no rawRow stored, only safe identifiers + reason
const RowOutcomeSchema = new Schema({
  rowNumber: { type: Number },
  identifier: { type: String }, // e.g. "GA / Bibb / 2024 / Flat Creek PFA"
  reason: { type: String }, // enum code, e.g. INVALID_NUMERIC
  field: { type: String }, // optional: which field caused the issue
  value: { type: String }, // optional: raw value as string
}, { _id: false });

const UploadAuditSchema = new Schema({
  uploadId: { type: String, index: true, unique: true },
  uploadedAt: { type: Date, default: Date.now, index: true },
  uploadedBy: { type: String }, // user email or "survey123-webhook"
  source: { type: String }, // "survey123" | "summarized-county" | "summarized-county-spots" | "summarized-rangerdistrict" | "summarized-rangerdistrict-spots"
  filename: { type: String },

  totalRows: { type: Number, default: 0 },
  acceptedRows: { type: Number, default: 0 },
  skippedRows: { type: Number, default: 0 },
  rejectedRows: { type: Number, default: 0 },

  skipped: { type: [RowOutcomeSchema], default: [] },
  rejected: { type: [RowOutcomeSchema], default: [] },

  // flags whether the persisted skipped/rejected arrays were truncated to fit
  // MAX_AUDIT_ENTRIES_PER_LIST — surface to the UI so users know the lists are
  // incomplete when rejectedRows/skippedRows exceed the visible entries.
  truncated: {
    skipped: { type: Boolean, default: false },
    rejected: { type: Boolean, default: false },
  },

  bulkWriteResult: { type: Object, default: null },

  status: { type: String }, // "processing" | "success" | "partial" | "failed"
  errorMessage: { type: String, default: null },
});

UploadAuditSchema.index({ uploadedAt: -1 });

const UploadAuditModel = mongoose.model('UploadAudit', UploadAuditSchema);

export default UploadAuditModel;
