require('dotenv').config()

const stateNameToStateAbbrev = {
    Alabama: 'AL',
    Arkansas: 'AR',
    Delaware: 'DE',
    Florida: 'FL',
    Georgia: 'GA',
    Kentucky: 'KY',
    Louisiana: 'LA',
    Maryland: 'MD',
    Mississippi: 'MS',
    'North Carolina': 'NC',
    'New Jersey': 'NJ',
    Oklahoma: 'OK',
    'South Carolina': 'SC',
    Tennesse: 'TN',
    Texas: 'TX',
    Virginia: 'VA',
  };

  
const updateSurvey = async (information) => {
    const url = process.env.MONGODB_URI;
    const MongoClient = require('mongodb').MongoClient;

    console.log(process.env.MONGODB_URI);

    MongoClient.connect(url, (error, db) => {
        if(error) throw error;
        
        const databaseObject = db.db(process.env.DATABASE_NAME);

        // todo:
        // store user data alongside survey data
        // store object associated with survey also
        // use the object associated with the survey

        filter = {
            'reference_id': information.reference_id,
        }

        databaseObject.collection("trappings").updateOne(filter, {$set: information}, function(err, res) {
            if (err) throw err;
            console.log("Trapping successfully updated.");
            db.close();
          });

    });
}


async function uploadSurvey(information, dbo){
    console.log("-------------")
    filter = information
    console.log("Information: ",information)
    historical =  await confirmHistorical(information,dbo)
    count = await countTrappings(information,dbo)

    console.log("HISTORICAL: ",historical)
    clerids = information.cleridsPerDay * 14
    spb = information.spb * 14

    if (count ==1){
        avgClerids = clerids
        avgSpb = spb
    }
    else{
        avgClerids = ((historical.cleridsPerTwoWeeks*(count-1)) + clerids) / count
        avgSpb =     ((historical.spbPerTwoWeeks    *(count-1)) + spb) / count
    }
    // console.log(historical.spbPerTwoWeeks    *(count-1))
    // console.log((historical.spbPerTwoWeeks    *(count-1)) + spb)
    // console.log("NUMS",avgClerids,avgSpb,count)

    filter = {
        state: historical.state,
        forest: historical.forest,
        year: historical.year,
    }
    newHistorical = { 
        $set: {
            state: historical.state,
            forest: historical.forest,
            year: historical.year,
            spbPerTwoWeeks: parseInt(avgSpb),
            cleridsPerTwoWeeks: parseInt(avgClerids)
        }
    }
    console.log("Filter",newHistorical)
    dbo.collection("historicals").updateMany(filter, newHistorical, function(err, res) {
        if(err) throw err;
        console.log("Modified: ",res.result.nModified)
	});
}

async function countTrappings(information,dbo){
    return new Promise((resolve,reject)=>{
        filter = {
            state : information.state,
            year: information.year,
            county: information.county
        }
        var count = 0
    
        dbo.collection("trappings").find(filter).toArray(function(err, result) {
            if (err) reject(err);
            if (result){
                console.log("Found: ",result.length);
                count = result.length
            }
            else{
                count = 0 
            }            
            newObj = information
            dbo.collection("trappings").insertOne(newObj, function(err, res) {
                if (err) reject(err);
                console.log("Trapping inserted");
                resolve(count + 1)
            });
        })
    })
}

async function confirmHistorical(information,dbo){
    return new Promise((resolve,reject)=>{
        filter = {
            state : stateNameToStateAbbrev[information.state],
            forest : information.county.toUpperCase() + " " + stateNameToStateAbbrev[information.state],
            year: information.year
        }
        dbo.collection("historicals").findOne(filter, function(err, result) {
            if (err) reject(err);
            if (result){
                console.log("FOUND")
                resolve(result)
            }
            else{
                newObj = filter
                dbo.collection("historicals").insertOne(newObj, function(err, res) {
                    if (err) reject(err);
                    console.log("1 document inserted");
                    resolve(newObj)
                });
            }
          })
    })
}



module.exports = {
    uploadSurvey: uploadSurvey,
    updateSurvey: updateSurvey
}