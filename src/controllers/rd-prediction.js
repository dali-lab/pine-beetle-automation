// /* eslint-disable no-restricted-globals */
// import * as rModel from './r-model';

// import { RESPONSE_TYPES } from '../constants';

// import {
//   getIndexes,
//   predictionFetchCreator,
//   predictionGeneratorCreator,
//   matchStateYear,
//   upsertOpCreator,
// } from '../utils';

// // upsert transform
// const upsertOp = upsertOpCreator(getIndexes(RDPredictionModel));

// /**
//   * @description generates all predictions for the ranger district level data.
//   * @param {Array<SummarizedRangerDistrictTrappingModel> sourceTrappingData the array of data to generate predictions over
//   * @param {Array<SummarizedRangerDistrictTrappingModel> t1TrappingData the array of data to do reverse year lookups on
//   * @returns {Promise<[RDPredictionModel]>} all docs
//   */
// const predictionGenerator = predictionGeneratorCreator('rangerDistrict', rModel.runModel, RDPredictionModel, upsertOp);

// /**
//  * @description generates all preds on ranger district level
//  */
// export const generateAllPredictions = async () => {
//   const allTrappingData = await SummarizedRangerDistrictTrappingModel.aggregate([
//     ...predictionFetchCreator('rangerDistrict'),
//   ]).exec();

//   return predictionGenerator(allTrappingData, allTrappingData);
// };

// /**
//  * @description generates predictions by ranger district on a state and year
//  * @param {String} state the state abbreviation
//  * @param {String} year the year abbreviation
//  */
// export const generateStateYearPredictions = async (state, year) => {
//   const sourcePromise = SummarizedRangerDistrictTrappingModel.aggregate([
//     ...matchStateYear(state, year),
//     ...predictionFetchCreator('rangerDistrict'),
//   ]).exec();

//   const t1Promise = SummarizedRangerDistrictTrappingModel.aggregate([
//     ...matchStateYear(state, year - 1),
//     ...predictionFetchCreator('rangerDistrict'),
//   ]).exec();

//   const sourceTrappingData = await sourcePromise;
//   const t1TrappingData = await t1Promise;

//   return predictionGenerator(sourceTrappingData, t1TrappingData);
// };

// // from router (only relevant thing to keep):

// RDPredictionRouter.route('/predict')
//   .get(requireAuth, async (req, res) => {
//     try {
//       const { state, year } = req.query;
//       if (state && year) {
//         await RDPrediction.generateStateYearPredictions(state, parseInt(year, 10));
//       } else {
//         await RDPrediction.generateAllPredictions();
//       }

//       const message = state && year
//         ? `predicted by ranger district on ${state} for ${year}`
//         : 'predicted all by ranger district';

//       res.send(generateResponse(RESPONSE_TYPES.SUCCESS, message));
//     } catch (error) {
//       const errorResponse = generateErrorResponse(error);
//       const { error: errorMessage, status } = errorResponse;
//       console.log(errorMessage);
//       res.status(status).send(errorResponse);
//     }
//   });
