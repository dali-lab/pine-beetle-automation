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

const uploadSurvey = async (information) => {
    const url = process.env.MONGODB_URI;
    const MongoClient = require('mongodb').MongoClient;

    console.log(process.env.MONGODB_URI);

    MongoClient.connect(url, (error, db) => {
        if(error) throw error;
        
        const databaseObject = db.db(process.env.DATABASE_NAME);

        databaseObject.collection("trappings").insertOne(information, function(err, res) {
            if (err) throw err;
            console.log("Trapping successfully inserted.");
            db.close();
          });

    });
    insertHistorical(information)
}

async function insertHistorical(information){
    return new Promise((resolve,reject)=>{
        checkExisting(information).then((message) =>{
            const url = process.env.MONGODB_URI;
            const MongoClient = require('mongodb').MongoClient;    
            console.log(message)
            console.log("intserting historical")
            MongoClient.connect(url, (error, db) => {
                if(error) throw error;
                const databaseObject = db.db(process.env.DATABASE_NAME);
                console.log(information)
                const filter = { 
                    "state" :stateNameToStateAbbrev[information.state],
                    "forest": information.county.toUpperCase() +" "+ stateNameToStateAbbrev[information.state],
                    "year": information.year 
                }
                databaseObject.collection("historicals").findOneAndUpdate(
                filter,
                { $inc: { "spbPerTwoWeeks" : Math.floor(information.spb*14),"cleridsPerTwoWeeks":Math.floor(information.cleridsPerDay*14)} },
                function(err, res) {
                    if (err) throw err;
                    console.log("Historical successfully updated.");
                    db.close();
                    resolve("Added")
                });

            })
        })
    })
}
async function checkExisting(information){
    return new Promise((resolve,reject) =>{
        const url = process.env.MONGODB_URI;
        const MongoClient = require('mongodb').MongoClient;
        console.log("Checking Existing")
        MongoClient.connect(url, (error, db) => {
            if(error) throw error;
            
            const databaseObject = db.db(process.env.DATABASE_NAME);
    
            const filter = { 
                "state" :stateNameToStateAbbrev[information.state],
                "forest": information.county.toUpperCase() +" "+ stateNameToStateAbbrev[information.state],
                "year": information.year 
            }
            console.log(filter)
            databaseObject.collection("historicals").findOne(filter, function(err, result) {
                if (err) throw err;
                if (!result){
                    const new_result = {
                        "state" :stateNameToStateAbbrev[information.state],
                        "forest": information.county.toUpperCase() +" "+ stateNameToStateAbbrev[information.state],
                        "year": information.year,
                        "spbPerTwoWeeks" :0,
                        "cleridsPerTwoWeeks":0
                    }
                    databaseObject.collection("historicals").insertOne(new_result, function(err, res) {
                        if (err) throw err;
                        resolve("Historical Created")
                      });
                }
                resolve("Not Created")
              });
        })     
    })
}

module.exports = {
    uploadSurvey: uploadSurvey,
    updateSurvey: updateSurvey,
    insertHistorical:insertHistorical,
    checkExisting:checkExisting
}