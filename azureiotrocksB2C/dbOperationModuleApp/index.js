const express = require('express');
const app = express();

var myArgs = process.argv.slice(2);
var localTestFlag = false;
if (myArgs[0] == "--local") localTestFlag = true;
if(localTestFlag){
    require('dotenv').config() //loading environment variable in local developing environment
    //enable CORS (for testing only -remove in production/deployment)
    console.log("Local test environment....")
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', 'http://localhost:5002');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        next();
    });    
}

app.use(express.json());
app.use(express.urlencoded({extended: true}));

//define sub routers for http requests
app.use("/userAccount", require("./routerUserAccount"))
app.use("/queryData", require("./routerQueryData"))
app.use("/insertData", require("./routerInsertData"))
app.use("/deleteData", require("./routerDeleteData"))

const port = process.env.PORT || 5001;

app.listen(port, () => {
    console.log('dboperationmodule Listening on port ' + port);
});
