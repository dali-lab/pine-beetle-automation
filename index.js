const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/new', (req, res) => {
    console.log('Got body:', req.body);
    res.sendStatus(200);
});

app.listen(port, () => {
    console.log('Server has started...');
});