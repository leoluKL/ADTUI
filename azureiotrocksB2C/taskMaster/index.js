const express = require('express');

const app = express();
const got = require('got');
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


var parseJWT =(token) =>{
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
            req.authInfo=parseJWT(bearerToken)  //this is the token from azure AD
            req.authInfo.account=req.authInfo.emails[0]
        }
        next();
    });
    //verify if the project jwt token is valid and the request project is accessible to this user account
    app.use((req, res, next) => {
        if(req.body.projectID!=null){
            var passProjectVerification=false
            var joinedProjectsToken = req.header("projects")
            if(joinedProjectsToken!=null){
                var availableProjects=parseJWT(joinedProjectsToken).availableProjects  //this is the token contain all usable projects for this user
                if(availableProjects[req.body.projectID]!=null) passProjectVerification=true
            }
            if(passProjectVerification){ //also check if the jwt is legal
                try {
                    var parsedJwt = jwt.verify(joinedProjectsToken,process.env.joinedProjectsJWTCreateSecret);
                  } catch(e) {
                    res.status(400).send("InvalidProjectToken")
                    return; //stop this http request as it asking to access nonauthorized project
                  }
            }
            
            if(!passProjectVerification){
                //reject the request
                res.status(400).send("ProjectNotAuthorized")
                return; //stop this http request as it asking to access nonauthorized project
            }
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
