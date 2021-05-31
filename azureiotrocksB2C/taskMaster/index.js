const express = require('express');

const app = express();
const got = require('got');


var url = "https://azureiotrocksdboperationmodule.azurewebsites.net/internal1"
    
app.get('/tointernal',
    async (req, res) => {
        var url = "https://azureiotrocksdboperationmodule.azurewebsites.net/internal1"
        var apireturn = await got.get(url)
        res.send("fetch back the internal api call response:"+ apireturn.body)
    }
);

const port = process.env.PORT || 5002;

app.listen(port, () => {
    console.log('taskMaster Listening on port ' + port);
});
