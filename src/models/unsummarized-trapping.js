import mongoose, { Schema } from 'mongoose';

// collection 1: historical unsummarized trapping
// multiple indexing on S/C/RD/Y to support aggregating individual years/states
// consider removing C/RD indexes later because we probably don't need them
const UnsummarizedTrappingSchema = new Schema({
  state: {
    type: String,
    index: true,
  },
  county: {
    type: String,
    index: true,
  },
  rangerDistrict: {
    type: String,
    index: true,
  },
  year: {
    type: Number,
    min: 1900,
    index: true,
  },
  month: {
    type: Number,
    min: 1,
    max: 12,
  },
  week: {
    type: Number,
    min: 1,
    max: 52,
  },
  spbCount: {
    type: Number,
    min: 0,
  },
  cleridCount: {
    type: Number,
    min: 0,
  },
  latitude: {
    type: Number,
    min: -90,
    max: 90,
  },
  longitude: {
    type: Number,
    min: -180,
    max: 180,
  },
});

const UnsummarizedTrappingModel = mongoose.model('UnsummarizedTrapping', UnsummarizedTrappingSchema);

export default UnsummarizedTrappingModel;
