const express = require('express');

const app = express();
const got = require('got');
const { v4:uuidv4 } = require('uuid');
const jwt = require('njwt')


var myArgs = process.argv.slice(2);
var localTestFlag = false;
if (myArgs[0] == "--local") localTestFlag = true;


//enable CORS (for testing only -remove in production/deployment)
if(localTestFlag){
    require('dotenv').config() //loading environment variable in local developing environment
    //enable CORS (for testing only -remove in production/deployment)
    console.log("Local test environment....")
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', 'http://localhost:5500'); //5500 is port of local running SPA in vscode live server
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        next();
    });    
}

app.use(express.json());
app.use(express.urlencoded({extended: true}));

//create the secret for creating JWT that will include information of projects each login user can access
global.jwtSecret= uuidv4()

/*
jwt.verify(testJWT+"e", jwtSecret, (err, verifiedJwt) => {
    if(err){
      console.log(err.message)
    }else{
      console.log(verifiedJwt.body.availableProjects)
    }
})
*/


var parseAuthTokenFromAzureAD =(token) =>{
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    base64= Buffer.from(base64, 'base64').toString();
    var jsonPayload = decodeURIComponent(base64.split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
};

if(!localTestFlag){
    app.use((req, res, next) => {
        var bearerToken = req.header("Authorization")
        if(bearerToken!=null){
            bearerToken= bearerToken.substring("Bearer ".length);
            req.authInfo=parseAuthTokenFromAzureAD(bearerToken)
            req.authInfo.account=req.authInfo.emails[0]
        }
        next();
    });
}else{
    app.use((req, res, next) => {
        req.authInfo={emails:["elephant.lyh@gmail.com"],account:"elephant.lyh@gmail.com", name: "testing", country: "Singapore", idp: "google.com"}
        next();
    });
}

//define sub routers for http requests
app.use("/accountManagement", require("./routerAccountManagement"))
app.use("/digitaltwin", require("./routerDigitalTwin"))
app.use("/devicemanagement", require("./routerDeviceManagement"))

const port = process.env.PORT || 5002;

app.listen(port, () => {
    console.log('taskMaster server starts, listening on port ' + port);
});
