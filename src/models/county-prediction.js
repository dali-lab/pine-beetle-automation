/* eslint-disable sort-keys */
import mongoose, { Schema } from 'mongoose';

// county prediction model
const CountyPredictionSchema = new Schema({
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
  prediction: {
    // { entry: value ... }
    type: Object,
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

// compound index of yr -> state -> county -> endobrev
CountyPredictionSchema.index({
  year: 1,
  state: 1,
  county: 1,
}, { unique: true });

const CountyPredictionModel = mongoose.model('CountyPrediction', CountyPredictionSchema);

export default CountyPredictionModel;
