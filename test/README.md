# Test Files

This directory contains python scripts used for data testing/validation. They are meant to be run locally and are not used programatically in any way.

## Summarized Checks

The [summarized-county-checker.py](./summarized-county-checker.py) and [summarized-rangerdistrict-checker.py](./summarized-rangerdistrict-checker.py) files compare the values in two CSVs for equality.

These scripts take in two arguments:

1. path to the source data CSV (e.g. the ground truth)

2. path to the test data CSV

They also take in an optional third argument for path to an output file to write to. This file does not have to exist. This will create a CSV with a line for each mismatched row with source and test values. If this argument is not supplied, the program will print out all mismatches to the console.
