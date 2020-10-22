/* eslint-disable import/prefer-default-export */
/* eslint-disable no-restricted-globals */
/* eslint-disable new-cap */

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

    const cleridst1 = t1?.cleridPer2Weeks; // default 77 if not found, do that later

    if (SPB === null || isNaN(SPB) || cleridst1 === null || isNaN(cleridst1)
    || spotst1 === null || isNaN(spotst2) || spotst2 === null || isNaN(spotst2)
    || endobrev === null || isNaN(endobrev)) {
      return null;
    }

    return {
      ...trappingObject,
      cleridst1,
      SPB,
    };
  });
  console.log(rawinputs);

  const inputs = rawinputs.filter((obj) => !!obj);
  const allPredictions = await ScriptRunner(inputs);
  const updatedData = inputs.map((doc, index) => {
    const {
      cleridPerDay,
      cleridst1,
      endobrev,
      SPB,
      spbPerDay,
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
      spotst1,
      spotst2,
      state,
      trapCount,
      year,
    };
  });

  return updatedData;
  // upsert results into db
  // const upsertOp = upsertOpCreator(getIndexes(CountyPredictionModel));
  // const writeOp = updatedData.map(upsertOp);
  // return CountyPredictionModel.bulkWrite(writeOp);
};
