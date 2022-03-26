# Test Files

This directory contains python scripts used for data testing/validation. They are meant to be run locally and are not used programatically in any way.

## Summarized Checker

The [summarized-checker.py](./summarized-checker.py) compares the values in two CSVs for equality. For each mismatched row, the script will output the difference between the two values and the percent difference (diff / average of two values).

These scripts take in three arguments:

1. `county` if running on county data (anything else will run as ranger district data)

1. path to the source data CSV (e.g. the ground truth)

1. path to the test data CSV

They also take in an optional third argument for path to an output file to write to. This file does not have to exist. This will create a CSV with a line for each mismatched row with source and test values. If this argument is not supplied, the program will print out all mismatches to the console.
