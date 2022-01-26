// /* eslint-disable no-restricted-globals */
// import * as rModel from './r-model';

// import {
//   getIndexes,
//   predictionFetchCreator,
//   predictionGeneratorCreator,
//   matchStateYear,
//   upsertOpCreator,
// } from '../utils';

// // upsert transform
// const upsertOp = upsertOpCreator(getIndexes(CountyPredictionModel));

// /**
//    * @description generates all predictions for the county level data.
//    * @param {Array<SummarizedCountyTrappingModel> sourceTrappingData the array of data to generate predictions over
//    * @param {Array<SummarizedCountyTrappingModel> t1TrappingData the array of data to do reverse year lookups on
//    * @returns {Promise<[CountyPredictionModel]>} all docs
//    */
// const predictionGenerator = predictionGeneratorCreator('county', rModel.runModel, CountyPredictionModel, upsertOp);

// /**
//  * @description generates all preds on county level
//  */
// export const generateAllPredictions = async () => {
//   const allTrappingData = await SummarizedCountyTrappingModel.aggregate([
//     ...predictionFetchCreator('county'),
//   ]).exec();

//   return predictionGenerator(allTrappingData, allTrappingData);
// };

// /**
//  * @description generates predictions by county on a state and year
//  * @param {String} state the state abbreviation
//  * @param {String} year the year abbreviation
//  */
// export const generateStateYearPredictions = async (state, year) => {
//   const sourcePromise = SummarizedCountyTrappingModel.aggregate([
//     ...matchStateYear(state, year),
//     ...predictionFetchCreator('county'),
//   ]).exec();

//   const t1Promise = SummarizedCountyTrappingModel.aggregate([
//     ...matchStateYear(state, year - 1),
//     ...predictionFetchCreator('county'),
//   ]).exec();

//   const sourceTrappingData = await sourcePromise;
//   const t1TrappingData = await t1Promise;

//   return predictionGenerator(sourceTrappingData, t1TrappingData);
// };

// // from router (only relevant thing to keep):

// CountyPredictionRouter.route('/predict')
//   .get(requireAuth, async (req, res) => {
//     try {
//       const { state, year } = req.query;
//       if (state && year) {
//         await CountyPrediction.generateStateYearPredictions(state, parseInt(year, 10));
//       } else {
//         await CountyPrediction.generateAllPredictions();
//       }

//       const message = state && year
//         ? `predicted by county on ${state} for ${year}`
//         : 'predicted all by county';

//       res.send(generateResponse(RESPONSE_TYPES.SUCCESS, message));
//     } catch (error) {
//       const errorResponse = generateErrorResponse(error);
//       const { error: errorMessage, status } = errorResponse;
//       console.log(errorMessage);
//       res.status(status).send(errorResponse);
//     }
//   });
