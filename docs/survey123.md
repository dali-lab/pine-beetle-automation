# `/survey123` routes

## `GET /upload`

Uploads a CSV of survey-123 style unsummarized data. This file can be directly downloaded from the Survey123 interface. Expects a `csv` file field in the body. Expects the following column names in the csv file:

- `ObjectID`
- `GlobalID`
- `Southern Pine Beetle`
- `State`
- `County/Parish`
- `Year`
- `Season`
- `Traps set out on:`
- `Trap name`
- `Person setting the trap (your name)`
- `Trap Lure`
- `Date of Inital bloom`
- `What bloomed?`
- `Comments`
- `Delete this survey?`
- `Date of Collection 1`
- `Active Trapping Days (1st Collection)`
- `Number SPB (1st Collection)`
- `Number Clerids (1st Collection)`
- `SPB_Plus_Clerids1`
- `Percent_SPB1`
- `SPB_PerDay1`
- `Clerids_PerDay1`
- `Date of Collection 2`
- `Active Trapping Days (2nd Collection)`
- `Number SPB (2nd Collection)`
- `Number Clerids (2nd Collection)`
- `SPB_Plus_Clerids2`
- `Percent_SPB2`
- `SPB_PerDay2`
- `Clerids_PerDay2`
- `Date of Collection 3`
- `Active Trapping Days (3rd Collection)`
- `Number SPB (3rd Collection)`
- `Number Clerids (3rd Collection)`
- `SPB_Plus_Clerids3`
- `Percent_SPB3`
- `SPB_PerDay3`
- `Clerids_PerDay3`
- `Date of Collection 4`
- `Active Trapping Days (4th Collection)`
- `Number SPB (4th Collection)`
- `Number Clerids (4th Collection)`
- `SPB_Plus_Clerids4`
- `Percent_SPB4`
- `SPB_PerDay4`
- `Clerids_PerDay4`
- `Date of Collection 5`
- `Active Trapping Days (5th Collection)`
- `Number SPB (5th Collection)`
- `Number Clerids (5th Collection)`
- `SPB_Plus_Clerids5`
- `Percent_SPB5`
- `SPB_PerDay5`
- `Clerids_PerDay5`
- `Date of Collection 6`
- `Active Trapping Days (6th Collection)`
- `Number SPB (6th Collection)`
- `Number Clerids (6th Collection)`
- `SPB_Plus_Clerids6`
- `Percent_SPB6`
- `SPB_PerDay6`
- `Clerids_PerDay6`
- `Sum_TrappingInterval`
- `Sum_SPB`
- `Sum_Clerids`
- `Sum_SPB_Plus_Clerids`
- `Overall_PercentSPB`
- `Overall_SPB_PerDay`
- `Overall_Clerids_PerDay`
- `Is this trap in a National Forest?`
- `National Forest (Ranger District)`
- `Trapping End Date`
- `CreationDate`
- `Creator`
- `EditDate`
- `Editor`
- `Latitude`
- `Longitude`
- `Is this the Final Collection?`
- `x`
- `y`

## `POST /webhook`

Route provided to Survey123 for uploading new data. Expects a `feature` object in the body with an `attributes` field containing the following fields:

- `SPB`
- `USA_State`
- `County`
- `Year`
- `Season`
- `TrapSetDate`
- `Trap_name`
- `Cooperator`
- `Trap_Lure`
- `Initial_Bloom`
- `Species_Bloom`
- `Comments`
- `DeleteSurvey`
- `CollectionDate1`
- `TrappingInterval1`
- `Number_SPB1`
- `Number_Clerids1`
- `SPB_Plus_Clerids1`
- `Percent_SPB1`
- `SPB_PerDay1`
- `Clerids_PerDay1`
- `CollectionDate2`
- `TrappingInterval2`
- `Number_SPB2`
- `Number_Clerids2`
- `SPB_Plus_Clerids2`
- `Percent_SPB2`
- `SPB_PerDay2`
- `Clerids_PerDay2`
- `CollectionDate3`
- `TrappingInterval3`
- `Number_SPB3`
- `Number_Clerids3`
- `SPB_Plus_Clerids3`
- `Percent_SPB3`
- `SPB_PerDay3`
- `Clerids_PerDay3`
- `CollectionDate4`
- `TrappingInterval4`
- `Number_SPB4`
- `Number_Clerids4`
- `SPB_Plus_Clerids4`
- `Percent_SPB4`
- `SPB_PerDay4`
- `Clerids_PerDay4`
- `CollectionDate5`
- `TrappingInterval5`
- `Number_SPB5`
- `Number_Clerids5`
- `SPB_Plus_Clerids5`
- `Percent_SPB5`
- `SPB_PerDay5`
- `Clerids_PerDay5`
- `CollectionDate6`
- `TrappingInterval6`
- `Number_SPB6`
- `Number_Clerids6`
- `SPB_Plus_Clerids6`
- `Percent_SPB6`
- `SPB_PerDay6`
- `Clerids_PerDay6`
- `Sum_TrappingInterval`
- `Sum_SPB`
- `Sum_Clerids`
- `Sum_SPB_Plus_Clerids`
- `Overall_PercentSPB`
- `Overall_SPB_PerDay`
- `Overall_Clerids_PerDay`
- `is_Nat_Forest`
- `Nat_Forest_Ranger_Dist`
- `Is_Final_Collection`
- `Trapping_End_Date`
- `Latitude`
- `Longitude`
- `globalid`
- `objectid`