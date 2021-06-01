const express = require('express');

const app = express();
const got = require('got');


var url = "https://azureiotrocksdboperationmodule.azurewebsites.net/internal1"

var parseJwt =(token) =>{
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
};

app.get('/tointernal',
    async (req, res) => {
        console.log('Validated claims: ', req.authInfo);
        var url = "https://azureiotrocksdboperationmodule.azurewebsites.net/internal1"
        var apireturn = await got.get(url)
        res.send("fetch back the internal api call response:"+ apireturn.body)
    }
);

const port = process.env.PORT || 5002;

app.listen(port, () => {
    console.log('taskMaster Listening on port ' + port);
});
