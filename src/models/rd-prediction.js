/* eslint-disable sort-keys */
import mongoose, { Schema } from 'mongoose';

// rd prediction model
const RDPredictionSchema = new Schema({
  cleridPerDay: {
    // { trapName: Number ...  }
    type: Object,
  },
  cleridst1: {
    type: Number,
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
  rangerDistrict: {
    type: String,
  },
  SPB: {
    type: Number,
  },
  spbPerDay: {
    // { trapName: Number ...  }
    type: Object,
  },
  spots: {
    type: Number,
  },
  spotst1: {
    type: Number,
  },
  spotst2: {
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
RDPredictionSchema.index({
  year: 1,
  state: 1,
  rangerDistrict: 1,
}, { unique: true });

const RDPredictionModel = mongoose.model('RDPrediction', RDPredictionSchema);

export default RDPredictionModel;
