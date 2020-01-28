require('dotenv').config()
const uploadSurvey = async (information) => {
    const url = process.env.MONGODB_URI;
    const MongoClient = require('mongodb').MongoClient;

    console.log(process.env.MONGODB_URI);

    MongoClient.connect(url, (error, db) => {
        if(error) throw error;
        
        const databaseObject = db.db(process.env.DATABASE_NAME);

        databaseObject.collection("trappings").updateOne(information, function(err, res) {
            if (err) throw err;
            console.log("Trapping successfully inserted.");
            db.close();
          });

    });
}

const updateSurvey = async (information) => {
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
    uploadSurvey: uploadSurvey
}