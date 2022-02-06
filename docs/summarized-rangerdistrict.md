# `/summarized-rangerdistrict` routes

## `GET /summarized-rangerdistrict`

Returns all summarized ranger district data.

## `POST /summarized-rangerdistrict`

Creates new entry for summarized ranger district data. Requires auth.

Accepts the following in the body (omitted fields will be set to `null`):

- `state`
- `rangerDistrict`
- `federalNameOld`
- `federalNameOlder`
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

## `DELETE /summarized-rangerdistrict`

Deletes all summarized ranger district data. Requires auth.

## `GET /summarized-rangerdistrict/filter`

Returns a filtered slice of the summarized ranger district data. Accepts the following query parameters:

- `startYear`
- `endYear`
- `state`
- `rangerDistrict`

Null parameters are ok; the filter will simply ignore them.

## `POST /summarized-rangerdistrict/spots/upload`

Uploads a CSV of ranger district-level spot data. Expects a `csv` file field in the body. Expects the following column names in the csv file:

- `rangerDistrict`
- `spotst0`
- `state`
- `year`

## `POST /summarized-rangerdistrict/upload`

Uploads a CSV of summarized ranger district data. Expects a `csv` file field in the body. Column names must match the above listed fields in `POST /summarized-rangerdistrict`.

## `GET /summarized-rangerdistrict/download`

Sends CSV of entire summarized ranger district collection

## `GET /summarized-rangerdistrict/:id`

Gets a row of summarized ranger district data by its unique id.

## `PUT /summarized-rangerdistrict/:id`

Updates a row of summarized ranger district data by its unique id.

Accepts the following in the body (omitted values will be ignored):

- `state`
- `rangerDistrict`
- `federalNameOld`
- `federalNameOlder`
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

## `DELETE /summarized-rangerdistrict/:id`

Deletes a row of summarized ranger district data by its unique id.
