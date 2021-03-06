/* eslint-disable import/prefer-default-export */
/* eslint-disable no-restricted-globals */
/* eslint-disable new-cap */

/**
 * higher-order function to create a prediction generator
 * @param {String} location either 'county' or 'rangerDistrict'
 * @param {Function} ScriptRunner service to execute the model running
 * @param {mongoose.Model} writeModel destination model to write to
 * @param {Function} upsertOp an upsert operation to do bulkwrites with
 * @returns {(sourceTrappingData: Array<Object>, t1TrappingData: Array<Object>) => Promise}
 */
export const predictionGeneratorCreator = (location, ScriptRunner, WriteModel, upsertOp) => async (sourceTrappingData, t1TrappingData) => {
  const rawinputs = sourceTrappingData.map((trappingObject) => {
    const {
      endobrev,
      spbPer2Weeks: SPB,
      spotst1,
      spotst2,
      state,
      year,
      [location]: loc,
    } = trappingObject;

    // look for 1 year before
    const t1 = t1TrappingData.find((obj) => {
      return obj.year === year - 1
        && obj.state === state
        && obj[location] === loc;
    });

    const cleridst1 = t1?.cleridPer2Weeks ?? null;

    if (SPB === null || isNaN(SPB) || isNaN(cleridst1)
    || spotst1 === null || isNaN(spotst1) || spotst2 === null || isNaN(spotst2)
    || endobrev === null || isNaN(endobrev)) {
      return null;
    }

    const allValidInput = [SPB, cleridst1, spotst1, spotst2, endobrev].reduce((acc, curr) => (
      acc && (curr === null || curr >= 0)
    ), true);

    if (!allValidInput) {
      return null;
    }

    return {
      ...trappingObject,
      cleridst1,
      SPB,
    };
  });

  // remove missing entries
  const inputs = rawinputs.filter((obj) => !!obj);
  const allPredictions = await ScriptRunner(inputs);

  // reformat and insert corresponding predictions object at the same index
  const updatedData = inputs.map((doc, index) => {
    const {
      cleridPerDay,
      cleridst1,
      endobrev,
      SPB,
      spbPerDay,
      spots,
      spotst1,
      spotst2,
      state,
      trapCount,
      year,
      [location]: loc,
    } = doc;

    return {
      cleridPerDay,
      cleridst1,
      endobrev,
      [location]: loc,
      prediction: allPredictions[index],
      SPB,
      spbPerDay,
      spots,
      spotst1,
      spotst2,
      state,
      trapCount,
      year,
    };
  });

  // upsert results into db
  const writeOp = updatedData.map(upsertOp);
  return WriteModel.bulkWrite(writeOp);
};
