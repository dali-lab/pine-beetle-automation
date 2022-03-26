# `/r-model` routes

## `GET /r-model`

Returns output of R model. Expects the following query parameters:

- `SPB`
- `cleridst1`
- `spotst1`
- `spotst2`
- `endobrev`

Defaults each parameter to 0 when not supplied.

## `GET /r-model/calculated-fields`

Calculates outcome fields (log transformations, etc) for document. Expects the following query parameters:

- `cleridsPer2Weeks`
- `probSpotsGT50`
- `spbPer2Weeks`
- `spotst0`
