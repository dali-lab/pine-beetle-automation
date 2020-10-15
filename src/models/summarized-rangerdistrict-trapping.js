/* eslint-disable sort-keys */
import mongoose, { Schema } from 'mongoose';

// collection 4: rangerdistrict-level trapping data aggregated by year
const SummarizedRangerDistrictTrappingSchema = new Schema({
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
  endobrev: {
    max: 1,
    min: 0,
    type: Number,
  },
  rangerDistrict: {
    type: String,
  },
  season: {
    type: String,
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
  state: {
    type: String,
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

// compound index of yr -> state -> rangerDistrict -> season -> endobrev
SummarizedRangerDistrictTrappingSchema.index({
  year: 1,
  state: 1,
  rangerDistrict: 1,
  season: 1,
  endobrev: 1,
}, { unique: true });

const SummarizedRangerDistrictTrappingModel = mongoose.model('SummarizedRangerDistrictTrapping', SummarizedRangerDistrictTrappingSchema);

export default SummarizedRangerDistrictTrappingModel;
