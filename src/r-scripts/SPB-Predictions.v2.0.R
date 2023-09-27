# Predictions-for-SPBpredict.com_v2.0.R
# Script to make predictions based on hard-coded coefficients,
# requiring these variables as input:
#	SPB: SPB per trap per two weeks during spring trapping (year t)
#	spotst1: beetle spots in forest last year (t-1)
#	endobrev: 0 or 1 for endobrevicomin absent or present in SPB traps

# revised by Matt on 16 Sept 2023 to match new ZIP model based on n = 3282 observations. 

attach(input[[1]]) # takes single parameter, called as callRScript(thisfilepath, { data: [{ SPB, cleridst1, spotst1, spotst2, endobrev }] }) from node.js
# this script DOES NOT check 'data' for validity; the caller is responsible.
attach(data)

# Coefficients below were estimated for a zero-inflated Poisson model fit to historical data using pscl package in R.
# These coefficients, and means and SDs that follow, remain the same for all predictions.

# coefficients for binomial model; predicts pi
b0_binom = 1.03486      # intercept
b1_binom = -1.22314    # SPB this year
b3_binom = -1.02526   # spots last year

# coefficients for count model; predicts mu
b0_count = 0.63780     # intercept
b1_count = 0.31115    # SPB this year
b3_count = 0.21979     # spots last year

# means and SDs of the log-transformed data used to fit the model. Used for centering and standardized the log transformed input data
SPB_mean = 3.303548
SPB_SD = 3.096779
spotst1_mean = 1.170344
spotst1_SD = 1.987272

# Prepare input data for model calculations
adjusted_SPB=SPB
adjusted_SPB[endobrev==1] = adjusted_SPB[endobrev==1]/10 # mulitply SPB by 10 if no endobrevicomin

# log transformations
lnSPB=log(adjusted_SPB+1)                
lnspotst1=log(spotst1+1)

# center and standardize log transformed values
SPB_adj=(lnSPB-SPB_mean)/SPB_SD                           
spotst1_adj=(lnspotst1-spotst1_mean)/spotst1_SD

# Calculate mu and pi
pi_pre = b0_binom+b1_binom*SPB_adj+b3_binom*spotst1_adj
mu_pre = b0_count+b1_count*SPB_adj+b3_count*spotst1_adj
pi=exp(pi_pre)/(1+exp(pi_pre))
mu=exp(mu_pre)
expSpots_if_spots=exp(mu)-1

Z=dpois(0, mu)         # probability of 0 spots from count model, given mu
ProbSpots.GT.0    = 1-(pi+(1-pi)*Z)                             # probability of > 0 spots considering both binomial and count model
ProbSpots.GT.0    = 1-(pi+(1-pi)*ppois(0,mu,lower.tail=TRUE))    # probability of > 0 spots considering both binomial and count model
ProbSpots.GT.18   = 1-(pi+(1-pi)*ppois(2,mu,lower.tail=TRUE))    # probability of > 18 spots considering both binomial and count model
ProbSpots.GT.53   = 1-(pi+(1-pi)*ppois(3,mu,lower.tail=TRUE))    # probability of > 53 spots considering both binomial and count model
ProbSpots.GT.147  = 1-(pi+(1-pi)*ppois(4,mu,lower.tail=TRUE))    # probability of > 147 spots considering both binomial and count model
ProbSpots.GT.402 = 1-(pi+(1-pi)*ppois(5,mu,lower.tail=TRUE))    # probability of > 1095 spots considering both binomial and count model
ProbSpots.GT.1095 = 1-(pi+(1-pi)*ppois(6,mu,lower.tail=TRUE))    # probability of > 2979 spots considering both binomial and count model

# Create data frame for output
preds=data.frame(
  expSpots_if_spots,
  ProbSpots.GT.0,
  ProbSpots.GT.18,
  ProbSpots.GT.53,
  ProbSpots.GT.147,
  ProbSpots.GT.402,
  ProbSpots.GT.1095)

# column renaming
colnames(preds) = c(
    "expSpotsIfOutbreak",
    "probSpotsGT0",
    "probSpotsGT20",
    "probSpotsGT50",
    "probSpotsGT150",
    "probSpotsGT400",
    "probSpotsGT1000"
)

preds # returns to caller


