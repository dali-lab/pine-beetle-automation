# Script to compute the outcome fields from trapping + prediction data,
# requiring these variables as input:
#	spbPer2Weeks: SPB per trap per two weeks during spring trapping (year t)
#	cleridsPer2Weeks: clerids per trap per two weeks during spring trapping (year t)
#	spotst0: beetle spots in forest this year (t)
#   probSpotsGT50: probability of >50 spots this year (year t)

attach(input[[1]]) # takes single parameter, called as callRScript(thisfilepath, { data: [{ spbPer2Weeks, cleridsPer2Weeks, spots }] }) from node.js
attach(data)

lnSPB = log(spbPer2Weeks+1)
lnClerids = log(cleridsPer2Weeks+1)
lnSpots = log(spotst0+1)
logitProb = log(probSpotsGT50 / (1-probSpotsGT50))
predSpotslogUnits = 0.129 + 6.743*(probSpotsGT50)
predSpotsorigUnits = exp(predSpotslogUnits)-1
residualSpotslogUnits = lnSpots - predSpotslogUnits

# construct a dataframe with each row corresponding to one prediction
fields = data.frame(
    lnSPB,
    lnClerids,
    lnSpots,
    logitProb,
    predSpotslogUnits,
    predSpotsorigUnits,
    residualSpotslogUnits
)

# column renaming
colnames(fields) = c(
    "ln(spbPer2Weeks+1)",
    "ln(cleridsPer2Weeks+1)",
    "ln(spotst0+1)",
    "logit(Prob>50)",
    "predSpotslogUnits",
    "predSpotsorigUnits",
    "residualSpotslogUnits"
)

fields # returns to caller
