const uploadSurvey = async (information) => {
    const url = process.env.MONGODB_URI;
    const MongoClient = require('mongodb').MongoClient;

    MongoClient.connect(url, (error, db) => {
        if(error) throw error;
        
        const databaseObject = db.db("heroku_cdlx19v1");
        const myobj = { name: "Company Inc", address: "Highway 37" };

        databaseObject.collection("trappings").insertOne(myobj, function(err, res) {
            if (err) throw err;
            console.log("1 document inserted");
            db.close();
          });

    });
}

module.exports = {
    uploadSurvey: uploadSurvey
}