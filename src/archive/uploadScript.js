const surveyController = require('./src/controllers/AutomationController');

require('dotenv').config()

//For uploading specifically columned CSVs of backed up Survey 123 data
async function start(dbo){
    var fs = require('fs');
    var fileContents = fs.readFileSync('./survey123.csv');
    var lines = fileContents.toString().split('\n');
    for (var i = 1; i < lines.length; i++) {
        line = lines[i].split(',')
        information = {
            x : parseFloat(line[6]),
            y : parseFloat(line[7]),
            state : line[1],
            year : parseInt(line[3]),
            county : line[2],
            spb : parseFloat(line[4]), //per day
            cleridsPerDay : parseFloat(line[5])
        }
        await surveyController.uploadSurvey(information,dbo)
    }

    
}
const url = process.env.MONGODB_URI;
const MongoClient = require('mongodb').MongoClient;    


MongoClient.connect(url, (error, db) => {
    const databaseObject = db.db(process.env.DATABASE_NAME);
    start(databaseObject)
})