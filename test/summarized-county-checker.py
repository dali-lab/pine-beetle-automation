## test script to check accuracy between two CSV inputs
## takes in filepath to source file, filepath to test file, and optional filepath to write output to
import sys
import pandas as pd

sourceOfTruthFile = sys.argv[1] # "./county-summarized-all.csv"
testFile = sys.argv[2] # "./no-2020:2021/outputs/rounding/county-summarized-with-missing-spots-ROUND-s123-changes.csv"
outputFile = sys.argv[3] if len(sys.argv) == 4 else None

sourceData = pd.read_csv(sourceOfTruthFile, header=0).fillna(value="None")
testData = pd.read_csv(testFile, header=0).fillna(value="None")

#################################################################################################

keysToCompare = ["hasSPBTrapping","isValidForPrediction","hasSpotst0","hasPredictionAndOutcome","endobrev","totalTrappingDays","trapCount","daysPerTrap","spbCount","spbPer2Weeks","spbPer2WeeksOrig","cleridsPer2Weeks","cleridst1","spotst0","spotst1","spotst2","pi","mu","expSpotsIfOutbreak","probSpotsGT0","probSpotsGT20","probSpotsGT50","probSpotsGT150","probSpotsGT400","probSpotsGT1000", "ln(spbPer2Weeks+1)","ln(cleridsPer2Weeks+1)","ln(spotst0+1)","logit(Prob>50)","predSpotslogUnits","predSpotsorigUnits","residualSpotslogUnits"]

mismatches = ["year,state,county,fieldName,sourceValue,testValue"]

for testRowIndex in testData.index:
    year = testData["year"][testRowIndex]
    state = testData["state"][testRowIndex]
    county = testData["county"][testRowIndex]

    sourceRow = sourceData[(sourceData["year"]==year) & (sourceData["state"]==state) & (sourceData["county"]==county)]

    if len(sourceRow.index) == 0:
        # print(f"MISSING ROW: {year} {state} {county:15} in source data")
        continue

    sourceRowIndex = sourceRow.index[0]

    for key in keysToCompare:
        sourceVal = sourceRow[key][sourceRowIndex]
        testVal = testData[key][testRowIndex]

        roundTestVal = round(testVal) if testVal != "None" else "None"

        if sourceVal != testVal:
            mismatches.append(f"{year},{state},{county},{key},{sourceVal},{testVal}")
            # print(f"MISMATCH: {year} {state} {county:15} {key} = {sourceVal} vs {testVal}")

if outputFile:
    with open(outputFile, "w") as f:
        f.writelines([m + "\n" for m in mismatches])
else:
    for m in mismatches:
        print(m)