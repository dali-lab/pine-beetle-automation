import mongoose, { Schema } from 'mongoose';

// collection 1: historical unsummarized trapping
// multiple indexing on S/Y to support aggregating individual years/states
const UnsummarizedTrappingSchema = new Schema({
  bloom: {
    type: String,
  },
  bloomDate: {
    type: Date,
  },
  cleridCount: {
    min: 0,
    type: Number,
  },
  collectionDate: {
    type: Date,
  },
  county: {
    type: String,
  },
  daysActive: {
    type: String,
  },
  endobrev: {
    type: Number, // unsure of this
  },
  fips: {
    type: Number,
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
  lure: {
    type: String,
  },
  rangerDistrict: {
    type: String,
  },
  season: {
    type: String,
  },
  sirexLure: {
    type: String, // unsure of this
  },
  spbCount: {
    min: 0,
    type: Number,
  },
  startDate: {
    type: Date,
  },
  state: {
    index: true,
    type: String,
  },
  trap: {
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
