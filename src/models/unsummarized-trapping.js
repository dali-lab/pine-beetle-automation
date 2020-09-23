import mongoose, { Schema } from 'mongoose';

// collection 1: historical unsummarized trapping
const UnsummarizedTrappingSchema = new Schema({
  state: { type: String },
  county: { type: String },
  rangerDistrict: { type: String },
  year: {
    type: Number,
    min: 1900,
    max: 2022,
    index: true, // speeds up aggregation by year
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
