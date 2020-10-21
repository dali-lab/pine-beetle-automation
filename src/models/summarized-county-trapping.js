/* eslint-disable sort-keys */
import mongoose, { Schema } from 'mongoose';

// collection 3: county-level trapping data aggregated by year
const SummarizedCountyTrappingSchema = new Schema({
  cleridCount: {
    min: 0,
    type: Number,
  },
  cleridPer2Weeks: {
    min: 0,
    type: Number,
  },
  cleridPerDay: {
    // { trapName: Number ...  }
    type: Object,
  },
  county: {
    type: String,
  },
  endobrev: {
    max: 1,
    min: 0,
    type: Number,
  },
  spbCount: {
    min: 0,
    type: Number,
  },
  spbPer2Weeks: {
    min: 0,
    type: Number,
  },
  spbPerDay: {
    // { trapName: Number ...  }
    type: Object,
  },
  spots: {
    default: null,
    min: 0,
    type: Number,
  },
  spotst1: {
    default: null,
    min: 0,
    type: Number,
  },
  spotst2: {
    default: null,
    min: 0,
    type: Number,
  },
  state: {
    type: String,
  },
  totalTrappingDays: {
    min: 1,
    type: Number,
  },
  trapCount: {
    min: 1,
    type: Number,
  },
  year: {
    min: 1900,
    type: Number,
  },
});

// compound index of yr -> state -> county -> endobrev
SummarizedCountyTrappingSchema.index({
  year: 1,
  state: 1,
  county: 1,
  endobrev: 1,
}, { unique: true });

const SummarizedCountyTrappingModel = mongoose.model('SummarizedCountyTrapping', SummarizedCountyTrappingSchema);

export default SummarizedCountyTrappingModel;
