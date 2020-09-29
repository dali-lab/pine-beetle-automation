import mongoose, { Schema } from 'mongoose';

// collection 1: historical unsummarized trapping
// multiple indexing on S/Y to support aggregating individual years/states
const UnsummarizedTrappingSchema = new Schema({
  cleridCount: {
    min: 0,
    type: Number,
  },
  county: {
    type: String,
  },
  latitude: {
    max: 90,
    min: -90,
    type: Number,
  },
  longitude: {
    max: 180,
    min: -180,
    type: Number,
  },
  month: {
    max: 12,
    min: 1,
    type: Number,
  },
  rangerDistrict: {
    type: String,
  },
  spbCount: {
    min: 0,
    type: Number,
  },
  state: {
    index: true,
    type: String,
  },
  week: {
    max: 52,
    min: 1,
    type: Number,
  },
  year: {
    index: true,
    min: 1900,
    type: Number,
  },
});

const UnsummarizedTrappingModel = mongoose.model('UnsummarizedTrapping', UnsummarizedTrappingSchema);

export default UnsummarizedTrappingModel;
