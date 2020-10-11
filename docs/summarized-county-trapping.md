## `GET /summarized-county-trapping`

Returns all summarized county trapping data.

## `POST /summarized-county-trapping`

Creates new entry for summarized county trapping data. Requires auth.

Expects the following in the body:

- `cleridCount`
- `cleridPerDay` (Object)
- `county`
- `endobrev`
- `spbCount`
- `spbPerDay` (Object)
- `spots`
- `state`
- `trapCount`
- `year`

## `GET /summarized-county-trapping/filter`

Returns a filtered slice of the summarized county trapping data. Expects the following query parameters:

- `startYear`
- `endYear`
- `state`
- `county`

Null parameters are ok; the filter will simply ignore them.

## `GET /summarized-county-trapping/aggregate`

Runs the county aggregation pipeline and returns a success message. Expects the following optional query parameters:

- `state`
- `year`

If either parameter is missing, then the pipeline will run for all unsummarized data. Otherwise, it will run for an individual state and year.

## `GET /summarized-county-trapping/download`

Sends CSV of entire summarized county trapping collection

## `GET /summarized-county-trapping/:id`

Gets a row of summarized county trapping data by its unique id.

## `PUT /summarized-county-trapping/:id`

Updates a row of summarized county trapping data by its unique id.

Expects the following in the body:

- `cleridCount`
- `cleridPerDay` (Object)
- `county`
- `endobrev`
- `spbCount`
- `spbPerDay` (Object)
- `spots`
- `state`
- `trapCount`
- `year`

Missing values will be ignored.

## `DELETE /summarized-county-trapping/:id`

Deletes a row of summarized trapping data by its unique id.
