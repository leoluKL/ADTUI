const express = require('express');


const app = express();
var myArgs = process.argv.slice(2);

app.use(express.json());
app.use(express.urlencoded({extended: true}));

//define sub routers for http requests
app.use("/controlPlane", require("./routerControlPlane"))
//app.use("/dataPlane", require("./routerDataPlane"))

const port = process.env.PORT || 5003;

app.listen(port, () => {
    console.log('iothubOperationmodule Listening on port ' + port);
});