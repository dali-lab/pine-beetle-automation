const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/new', (req, res) => {
    const featureData = req.body.feature;
    const attributes = featureData.attributes;
    const coordinateData = featureData.geometry;

    const cleridData = [attributes.Clerids_PerDay1, 
                        attributes.Clerids_PerDay2, 
                        attributes.Clerids_PerDay3, 
                        attributes.Clerids_PerDay4, 
                        attributes.Clerids_PerDay5, 
                        attributes.Clerids_PerDay6];

    console.log(featureData);
    console.log(coordinateData);
    console.log(cleridData);

    res.sendStatus(200);
});

app.listen(port, () => {
    console.log('Server has started...');
});