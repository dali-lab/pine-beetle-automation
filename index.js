const express = require('express');
const app = express();

require('dotenv').config()

const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;


const uploadSurvey = require('./src/controllers/AutomationController');

function add(dx, element) {
    return dx + element;
}

app.use(express.json());

// const mongoConnection = process.env.MONGODB_URI;
// mongoose.connect(mongoConnection, { useNewUrlParser: true });

app.post('/edit', (req, res) => {
    console.log(req.body);
    res.sendStatus(200);
});


app.post('/new', (req, res) => {
    const featureData = req.body.feature;
    const attributes = featureData.attributes;
    const coordinateData = featureData.geometry;

    // data about the number of clerids which were recorded
    const cleridData = [attributes.Number_Clerids1, 
                        attributes.Number_Clerids2, 
                        attributes.Number_Clerids3, 
                        attributes.Number_Clerids4, 
                        attributes.Number_Clerids5, 
                        attributes.Number_Clerids6];
    const cleridAverage = cleridData.reduce(add, 0) / 6;

    // data about the number of SPBs which were recorded
    const SPBData = [attributes.Number_SPB1, 
                    attributes.Number_SPB2, 
                    attributes.Number_SPB3, 
                    attributes.Number_SPB4, 
                    attributes.Number_SPB5, 
                    attributes.Number_SPB6];
    const SPBAverage = SPBData.reduce(add, 0) / 6;

    // data about the number of SPBs in conjunction with the number of clerids
    const hybridData = [attributes.SPB_Plus_Clerids1,
                        attributes.SPB_Plus_Clerids2,
                        attributes.SPB_Plus_Clerids3,
                        attributes.SPB_Plus_Clerids4,
                        attributes.SPB_Plus_Clerids5,
                        attributes.SPB_Plus_Clerids6];
    const hybridAverage = hybridData.reduce(add, 0) / 6;


    // information about the location of the collection point
    const county = attributes.County;
    const state = attributes.USA_State;
    const year = attributes.Year;
    const trapName = attributes.Trap_name;

    // meta-data around the trapping request
    const lure = attributes.Trap_Lure;
    const collectorName = attributes.Cooperator;

    const cleridsPerDay = attributes.Overall_Clerids_PerDay;
    const SPBPerDay = attributes.Overall_SPB_PerDay;
    /*

    Example Data (sent from ArcGIS)

    {
    "_id": {
        "$oid": "5bea41b28cc07b0035a91cd0"
    },
    "x": -91.71954434655838,
    "y": 33.2674341513974,
    "state": "Arkansas",
    "year": 2019,
    "lure": "frontalin, Sirex sleeve, and endo-brevicomin",
    "county": "Ashley",
    "dateTrapSet": {
        "$date": "2018-10-09T05:00:00.000Z"
    },
    "trapName": "Ashley 3",
    "collectorName": "AR_DMSM_1_partner",
    "bloomDate": null,
    "spb": null,
    "totalBeetles": 9,
    "cleridsPerDay": 0.3,
    "__v": 0
    }

    */

    information = {
        'x': coordinateData.x,
        'y': coordinateData.y,
        'state': state,
        'year': year,
        'lure': lure,
        'county': county,
        'dateTrapSet': new Date(attributes.TrapSetDate),
        'trapName': trapName,
        'collectorName': collectorName,
        'bloomDate': new Date(attributes.Initial_Bloom),
        'spb': SPBPerDay,
        'totalBeetles': attributes.Sum_SPB_Plus_Clerids,
        "cleridsPerDay": cleridsPerDay,
    }

    uploadSurvey.uploadSurvey(information);

    res.sendStatus(200);
});

app.listen(port, () => {
    console.log('Server has started...');
});