/* eslint-disable import/prefer-default-export */

export const aggregationPipelineCreator = (location, collection) => [
  {
    $match: { [location]: { $ne: null } },
  },
  {
    $group: {
      _id: {
        [location]: `$${location}`,
        state: '$state',
        year: '$year',
      },
      cleridCount: { $sum: '$cleridCount' },
      spbCount: { $sum: '$spbCount' },
    },
  },
  {
    $project: {
      _id: 0,
      cleridCount: 1,
      [location]: `$_id.${location}`,
      spbCount: 1,
      state: '$_id.state',
      year: '$_id.year',
    },
  },
  {
    $merge: {
      into: collection,
      on: [location, 'state', 'year'],
      whenMatched: 'keepExisting',
    },
  },
];
