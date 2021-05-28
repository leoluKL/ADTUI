const express = require('express');

const app = express();
var myArgs = process.argv.slice(2);
var localTestFlag = false;

if (myArgs[0] == "--local") localTestFlag = true;

//enable CORS (for testing only -remove in production/deployment)
if(localTestFlag){
    console.log("Local test environment....")
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', 'http://localhost:5500');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        next();
    });    
}

// API endpoint
app.get('/hello',
    (req, res) => {
        console.log("receive a request")
        res.status(200).send("hello test first time for dev op local development")
    }
);

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log('Listening on port ' + port);
});
