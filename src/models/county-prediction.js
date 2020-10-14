/* eslint-disable sort-keys */
import mongoose, { Schema } from 'mongoose';

// county prediction model
const CountyPredictionSchema = new Schema({
  cleridPerDay: {
    min: 0,
    type: Number,
  },
  county: {
    type: String,
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

// compound index of yr -> state -> county -> endobrev
CountyPredictionSchema.index({
  year: 1,
  state: 1,
  county: 1,
  endobrev: 1,
}, { unique: true });

const CountyPredictionModel = mongoose.model('CountyPrediction', CountyPredictionSchema);

export default CountyPredictionModel;
