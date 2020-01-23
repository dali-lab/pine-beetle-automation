const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/new', (req, res) => {
    const featureData = req.body.feature;
    const coordinateData = req.body.geometry;

    const cleridData = [featureData.Clerids_PerDay1, 
                        featureData.Clerids_PerDay2, 
                        featureData.Clerids_PerDay3, 
                        featureData.Clerids_PerDay4, 
                        featureData.Clerids_PerDay5, 
                        featureData.Clerids_PerDay6];

    console.log(featureData);
    console.log(coordinateData);
    console.log(cleridData);

    res.sendStatus(200);
});

app.listen(port, () => {
    console.log('Server has started...');
});