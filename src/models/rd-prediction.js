import mongoose, { Schema } from 'mongoose';

// rd prediction model
const RDPredictionSchema = new Schema({
  cleridPerDay: {
    min: 0,
    type: Number,
  },
  prediction: [
    {
      _row: 'pi',
      predictions: { min: 0, type: Number },
    },
    {
      _row: 'mu',
      predictions: { min: 0, type: Number },
    },
    {
      _row: 'Exp spots if outbreak',
      predictions: { min: 0, type: Number },
    },
    {
      _row: 'prob.Spots>0',
      predictions: { min: 0, type: Number },
    },
    {
      _row: 'prob.Spots>19',
      predictions: { min: 0, type: Number },
    },
    {
      _row: 'prob.Spots>53',
      predictions: { min: 0, type: Number },
    },
    {
      _row: 'prob.Spots>147',
      predictions: { min: 0, type: Number },
    },
    {
      _row: 'prob.Spots>402',
      predictions: { min: 0, type: Number },
    },
    {
      _row: 'prob.Spots>1095',
      predictions: { min: 0, type: Number },
    },
  ],
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

// compound index of yr -> state -> rd
// eslint-disable-next-line sort-keys
RDPredictionSchema.index({ county: 1, rangerDistrict: 1, state: 1 }, { unique: true });

const RDPredictionModel = mongoose.model('CountyRDPrediction', RDPredictionSchema);

export default RDPredictionModel;
