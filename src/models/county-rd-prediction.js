import mongoose, { Schema } from 'mongoose';

// collection 5: county and ranger district prediction model
// multiple indexing on state/county/rd/year for index intersection
const CountyRDPredictionSchema = new Schema({
  cleridPerDay: {
    min: 0,
    type: Number,
  },
  county: {
    index: true,
    type: String,
  },
  data: [
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
    index: true,
    type: String,
  },
  spbPerDay: {
    min: 0,
    type: Number,
  },
  state: {
    index: true,
    type: String,
  },
  trapCount: {
    min: 0,
    type: Number,
  },
  year: {
    index: true,
    min: 1900,
    type: Number,
  },
});

const CountyRDPredictionModel = mongoose.model('CountyRDPrediction', CountyRDPredictionSchema);

export default CountyRDPredictionModel;
