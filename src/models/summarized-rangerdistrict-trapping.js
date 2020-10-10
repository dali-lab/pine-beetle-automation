import mongoose, { Schema } from 'mongoose';

// collection 4: rangerdistrict-level trapping data aggregated by year
const SummarizedRangerDistrictTrappingSchema = new Schema({
  cleridCount: {
    min: 0,
    type: Number,
  },
  cleridPerDay: {
    // { trapName: Number ...  }
    type: Object,
  },
  rangerDistrict: {
    type: String,
  },
  spbCount: {
    min: 0,
    type: Number,
  },
  spbPerDay: {
    // { trapName: Number ...  }
    type: Object,
  },
  spots: {
    default: -1,
    min: -1,
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

// compound index of yr -> state -> rangerDistrict
// eslint-disable-next-line sort-keys
SummarizedRangerDistrictTrappingSchema.index({ year: 1, state: 1, rangerDistrict: 1 }, { unique: true });

const SummarizedRangerDistrictTrappingModel = mongoose.model('SummarizedRangerDistrictTrapping', SummarizedRangerDistrictTrappingSchema);

export default SummarizedRangerDistrictTrappingModel;
