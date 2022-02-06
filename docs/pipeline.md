# `/pipeline` routes

## `GET /pipeline`

Runs the full summarization -> prediction pipeline for all data. Requires auth.

Accepts the a `cutoffYear` query parameter to specify a distinct year before which to not modify data. Defaults to 2021.
