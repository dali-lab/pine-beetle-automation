/**
 * higher-order function that creates an upsert operation
 * @param {Array<String>} indexes the indexes to match uniqueness on
 * @param {Object} data the data operated on
 * @returns (Function) to feed into bulkWrite
 */
export const upsertOpCreator = (indexes) => (data) => ({
  updateOne: {
    filter: Object.fromEntries(indexes.map((index) => [index, data[index]])),
    update: data,
    upsert: true,
  },
});

/**
 * helper function to get the model attributes of any mode
 * @param {mongoose.Model) ModelName the model to extract from
 * @returns {Array<String>} the attribute names
   */
export const getModelAttributes = (ModelName) => (
  Object.keys(ModelName.schema.paths)
    .filter((attr) => attr !== '_id' && attr !== '__v')
);

/**
   * helper function to get the numeric model attributes of any mode
   * @param {mongoose.Model) ModelName the model to extract from
   * @returns {Array<String>} the attribute names
   */
export const getModelNumericAttributes = (ModelName) => {
  return Object.keys(ModelName.schema.paths)
    .filter((attr) => attr !== '_id' && attr !== '__v' && ModelName.schema.paths[attr].instance === 'Number');
};

/**
   * @description extracts the compound index from a model
   * @param {Model} Model the mongoose model wanted
   * @returns {Array<String>} array of string index names
   */
export const getModelIndexes = (Model) => {
  const indexes = Model.schema.indexes();
  return Object.keys(indexes.find(([_idx, attr]) => !!attr.unique)[0]);
};
