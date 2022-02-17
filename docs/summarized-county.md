# `/summarized-county` routes

## `GET /summarized-county`

Returns all summarized county data.

## `POST /summarized-county`

Creates new entry for summarized county data. Requires auth.

Accepts the following in the body (omitted fields will be set to `null`):

- `state`
- `county`
- `FIPS`
- `year`
- `hasSPBTrapping`
- `isValidForPrediction`
- `hasSpotst0`
- `hasPredictionAndOutcome`
- `endobrev`
- `totalTrappingDays`
- `trapCount`
- `daysPerTrap`
- `spbCount`
- `spbPer2Weeks`
- `spbPer2WeeksOrig`
- `spbPerDay` (Object)
- `cleridsPer2Weeks`
- `cleridPerDay` (Object)
- `cleridst1`
- `spotst0`
- `spotst1`
- `spotst2`
- `pi`
- `mu`
- `expSpotsIfOutbreak`
- `probSpotsGT0`
- `probSpotsGT20`
- `probSpotsGT50`
- `probSpotsGT150`
- `probSpotsGT400`
- `probSpotsGT1000`
- `ln(spbPer2Weeks+1)`
- `ln(cleridsPer2Weeks+1)`
- `ln(spotst0+1)`
- `logit(Prob>50)`
- `predSpotslogUnits`
- `predSpotsorigUnits`
- `residualSpotslogUnits`

## `DELETE /summarized-county`

Deletes all summarized county data. Requires auth.

## `GET /summarized-county/filter`

Returns a filtered slice of the summarized county data. Accepts the following query parameters:

- `startYear`
- `endYear`
- `state`
- `county`

Null parameters are ok; the filter will simply ignore them.

## `POST /summarized-county/spots/upload`

Uploads a CSV of county-level spot data. Expects a `csv` file field in the body. Expects the following column names in the csv file:

- `county`
- `spotst0`
- `state`
- `year`

## `POST /summarized-county/upload`

Uploads a CSV of summarized county data. Expects a `csv` file field in the body. Column names must match the above listed fields in `POST /summarized-county`.

## `GET /summarized-county/download`

Sends CSV of entire summarized county collection

## `GET /summarized-county/download-predicted`

Sends CSV of predictions of county collection

## `GET /summarized-county/:id`

Gets a row of summarized county data by its unique id.

## `PUT /summarized-county/:id`

Updates a row of summarized county data by its unique id.

Accepts the following in the body (omitted values will be ignored):

- `state`
- `county`
- `FIPS`
- `year`
- `hasSPBTrapping`
- `isValidForPrediction`
- `hasSpotst0`
- `hasPredictionAndOutcome`
- `endobrev`
- `totalTrappingDays`
- `trapCount`
- `daysPerTrap`
- `spbCount`
- `spbPer2Weeks`
- `spbPer2WeeksOrig`
- `spbPerDay` (Object)
- `cleridsPer2Weeks`
- `cleridPerDay` (Object)
- `cleridst1`
- `spotst0`
- `spotst1`
- `spotst2`
- `pi`
- `mu`
- `expSpotsIfOutbreak`
- `probSpotsGT0`
- `probSpotsGT20`
- `probSpotsGT50`
- `probSpotsGT150`
- `probSpotsGT400`
- `probSpotsGT1000`
- `ln(spbPer2Weeks+1)`
- `ln(cleridsPer2Weeks+1)`
- `ln(spotst0+1)`
- `logit(Prob>50)`
- `predSpotslogUnits`
- `predSpotsorigUnits`
- `residualSpotslogUnits`

## `DELETE /summarized-county/:id`

Deletes a row of summarized county data by its unique id.
