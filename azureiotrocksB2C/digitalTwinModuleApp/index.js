const express = require('express');

const app = express();

// API endpoint
app.get('/hello',
    (req, res) => {
        console.log("receive a request")
        res.status(200).send("hello change something no secure")
    }
);

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log('Listening on port ' + port);
});
