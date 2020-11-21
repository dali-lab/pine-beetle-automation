#!/bin/bash
cd src/constants
rm -rf helper-data.zip
zip helper-data.zip \
    abbrev-to-state.json \
    csv-to-spots-county.json \
    csv-to-spots-rangerdistrict.json \
    csv-to-unsummarized.json \
    state-nf-rd-mapping.json \
    state-nf-mapping.json \
    rd-name-mapping.json
cd ../../