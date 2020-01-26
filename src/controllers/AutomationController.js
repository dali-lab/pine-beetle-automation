const dotenv = require('dotenv');
dotenv.config();


const uploadSurvey = async (information) => {
    const url = process.env.MONGODB_URI;
    const MongoClient = require('mongodb').MongoClient;


    MongoClient.connect(url, (error, db) => {
        if(error) throw error;
        
        const databaseObject = db.db(process.env.DATABASE_NAME);

        // todo:
        // 1. using the information sent from webhook, create information JSON
        // 2. verify upload has taken place
        // 3. correctly calculate specific fields

        /*databaseObject.collection("trappings").insertOne(information, function(err, res) {
            if (err) throw err;
            console.log("Trapping successfully inserted.");
            db.close();
          });*/

    });
}

module.exports = {
    uploadSurvey: uploadSurvey
}