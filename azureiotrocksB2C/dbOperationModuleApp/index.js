const express = require('express');

const app = express();


app.get('/internal1',
    (req, res) => {
        res.send("this is an internal response")
    }
);

const port = process.env.PORT || 5001;

app.listen(port, () => {
    console.log('Listening on port ' + port);
});
