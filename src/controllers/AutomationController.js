const uploadSurvey = async (information) => {
    const url = 'mongodb://heroku_cdlx19v1:72dnr3u2vdaju3r3irnvtci3ge@ds023485.mlab.com:23485/heroku_cdlx19v1'//process.env.MONGODB_URI;
    const MongoClient = require('mongodb').MongoClient;

    console.log(process.env.MONGODB_URI);

    MongoClient.connect(url, (error, db) => {
        if(error) throw error;
        
        const databaseObject = db.db("heroku_cdlx19v1");

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