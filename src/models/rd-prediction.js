import mongoose, { Schema } from 'mongoose';

// rd prediction model
const RDPredictionSchema = new Schema({
  cleridPerDay: {
    // { trapName: Number ...  }
    type: Object,
  },
  prediction: [
    {
      _row: String,
      predictions: { min: 0, type: Number },
    }],
  rangerDistrict: {
    type: String,
  },
  spbPerDay: {
    // { trapName: Number ...  }
    type: Object,
  },
  state: {
    type: String,
  },
  trapCount: {
    min: 0,
    type: Number,
  },
  year: {
    min: 1900,
    type: Number,
  },
});

// compound index of yr -> state -> rd
// eslint-disable-next-line sort-keys
RDPredictionSchema.index({ year: 1, state: 1, rangerDistrict: 1 }, { unique: true });

const RDPredictionModel = mongoose.model('RDPrediction', RDPredictionSchema);

export default RDPredictionModel;
