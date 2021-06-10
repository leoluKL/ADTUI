'use strict';

const express = require('express')
const path = require('path')
const reload = require('reload')
const fs = require('fs')
const open = require("open")

var myArgs = process.argv.slice(2);
var devFlag = false;




function httpServerHelper(adtClients){
    this.adtClients=adtClients
}

//create http server
httpServerHelper.prototype.createHTTPServer=function(){
    var app = express()
    var publicDir;
    if (myArgs[0] == "--dev") {
        devFlag = true;
        app.set('port', 8000)
        publicDir = path.join(__dirname, '../portalDev/')
    } else {
        app.set('port', 9000)
        publicDir = path.join(__dirname, '../portalProduction/')
    }
    
    app.use(express.static(publicDir));
    app.use(express.static(path.join(__dirname, '../node_modules/')));
    app.use(express.static(path.join(__dirname, '../libfiles/')));
    app.use(express.static(path.join(__dirname, '../css/')));

    app.use(express.json());
    app.use(express.urlencoded({extended: true}));

    //define sub routers for http requests
    app.use("/queryADT", require("./routerQueryADT")(this.adtClients))
    app.use("/editADT", require("./routerEditADT")(this.adtClients))
    app.use("/twinsFilter", require("./routerTwinsFilters")())
    app.use("/visualDefinition", require("./routerVisualDefinition")())
    app.use("/layout", require("./routerLayoutStore")())

    
    if(devFlag){
        var delayReloadFlag=null;
        var triggerReload=(reloadReturned)=>{
            if(delayReloadFlag!=null){
                clearTimeout(delayReloadFlag);
                delayReloadFlag=null;
            }
            delayReloadFlag=setTimeout(()=>{
                console.log("refresh browser...")
                reloadReturned.reload();
                delayReloadFlag=null;
            },300)
        }
        reload(app).then(function (reloadReturned) {
            // Reload started, start web server
            app.listen(app.get('port'), () => {
                console.log('Web server listening on port ' + app.get('port'))
                open('http://localhost:' + app.get('port'), function (err) {
                    if (err) throw err;
                });
            });
        
            fs.watch(publicDir, (eventType, filename) => {triggerReload(reloadReturned)});
            fs.watch(path.join(__dirname, '../css/'), (eventType, filename) => {triggerReload(reloadReturned)});
        }).catch(function (err) {
            console.error('Reload could not start, could not start server/sample app', err)
        })
    }else{
        app.listen(app.get('port'), () => {
            console.log('Web server listening on port ' + app.get('port'))
            open('http://localhost:' + app.get('port'), function (err) {
                if (err) throw err;
            });
        });
    }
}


module.exports = httpServerHelper;