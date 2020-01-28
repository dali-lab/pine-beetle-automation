require('dotenv').config()

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
}

module.exports = {
    uploadSurvey: uploadSurvey,
    updateSurvey: updateSurvey
}