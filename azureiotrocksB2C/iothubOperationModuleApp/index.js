const express = require('express');


const app = express();
var myArgs = process.argv.slice(2);
var localTestFlag = false;
if (myArgs[0] == "--local") localTestFlag = true;

if(localTestFlag){
    require('dotenv').config() //loading environment variable in local developing environment
}

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

app.get('/hello',
    (req, res) => {
        res.send("this is iot hub api module")
    }
);

const port = process.env.PORT || 5005;

app.listen(port, () => {
    console.log('Listening on port ' + port);
});
