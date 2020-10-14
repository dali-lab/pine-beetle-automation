/* eslint-disable sort-keys */
import mongoose, { Schema } from 'mongoose';

// rd prediction model
const RDPredictionSchema = new Schema({
  cleridPerDay: {
    min: 0,
    type: Number,
  },
  endobrev: {
    max: 1,
    min: 0,
    type: Number,
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
    min: 0,
    type: Number,
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

// compound index of yr -> state -> rd -> endobrev
RDPredictionSchema.index({
  year: 1,
  state: 1,
  rangerDistrict: 1,
  endobrev: 1,
}, { unique: true });

const RDPredictionModel = mongoose.model('RDPrediction', RDPredictionSchema);

export default RDPredictionModel;
