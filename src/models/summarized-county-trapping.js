import mongoose, { Schema } from 'mongoose';

// collection 3: county-level trapping data aggregated by year
const SummarizedCountyTrappingSchema = new Schema({
  cleridCount: {
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
  spbCount: {
    min: 0,
    type: Number,
  },
  spbPerDay: {
    // { trapName: Number ...  }
    type: Object,
  },
  spots: {
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

// compound index of yr -> state -> county
// eslint-disable-next-line sort-keys
SummarizedCountyTrappingSchema.index({ year: 1, state: 1, county: 1 }, { unique: true });

const SummarizedCountyTrappingModel = mongoose.model('SummarizedCountyTrapping', SummarizedCountyTrappingSchema);

export default SummarizedCountyTrappingModel;
