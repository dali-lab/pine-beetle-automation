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

// compound index of yr -> state -> county
// eslint-disable-next-line sort-keys
CountyPredictionSchema.index({ year: 1, state: 1, county: 1 }, { unique: true });

const CountyPredictionModel = mongoose.model('CountyPrediction', CountyPredictionSchema);

export default CountyPredictionModel;
