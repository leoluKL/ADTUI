(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const signupsigninname="B2C_1_singupsignin_spaapp1"
const b2cTenantName="azureiotb2c"

const url = new URL(window.location.href);

var strArr=window.location.href.split("?")
var isLocalTest=(strArr.indexOf("test=1")!=-1)

const globalAppSettings={
    "b2cSignUpSignInName": signupsigninname,
    "b2cScope_taskmaster":"https://"+b2cTenantName+".onmicrosoft.com/taskmastermodule/operation",
    "b2cScope_functions":"https://"+b2cTenantName+".onmicrosoft.com/azureiotrocksfunctions/basic",
    "logoutRedirectUri": url.origin+"/spaindex.html",
    "msalConfig":{
        auth: {
            clientId: "f4693be5-601b-4d0e-9208-c35d9ad62387",
            authority: "https://"+b2cTenantName+".b2clogin.com/"+b2cTenantName+".onmicrosoft.com/"+signupsigninname,
            knownAuthorities: [b2cTenantName+".b2clogin.com"],
            redirectUri: window.location.href
        },
        cache: {
            cacheLocation: "sessionStorage", 
            storeAuthStateInCookie: false
        },
        system: {
            loggerOptions: {
                loggerCallback: (level, message, containsPii) => {}
            }
        }
    },
    "isLocalTest":isLocalTest,
    "taskMasterAPIURI":((isLocalTest)?"http://localhost:5002/":"https://azureiotrockstaskmastermodule.azurewebsites.net/"),
    "functionsAPIURI":"https://azureiotrocksfunctions.azurewebsites.net/api/"
}

module.exports = globalAppSettings;
},{}],2:[function(require,module,exports){
//the Start page is the sign in page
const globalAppSettings=require("./globalAppSettings")
const msalHelper=require("./msalHelper")

function mainUI() {
    this.myMSALObj = new msal.PublicClientApplication(globalAppSettings.msalConfig);
    $('#signInBtn').on("click",async ()=>{
        var theAccount=await msalHelper.signIn()
        if(theAccount!=null) this.afterSignedIn(theAccount);
    })
    //in case of page refresh and it might be ok to fetch account directly from cache
    var theAccount=msalHelper.fetchAccount(); 

    if(theAccount!=null) this.afterSignedIn(theAccount,"noAnimation")
}

mainUI.prototype.afterSignedIn=async function(anAccount,noAnimation){
    if(noAnimation){
        $('#headerPart').css({height:"100vh","padding":"15px"})
        this.showModuleButtons()
    }else{
        $('#headerPart').animate({height:"100vh"})
        $('#githublink').animate({opacity:"0"})
        $('#signInBtn').animate({opacity:"0"})
        $('#footerPart').animate({opacity:"0"},()=>{this.showModuleButtons()})
        $('#headerPart').animate({"padding":"15px"})
    }

    //also notify taskmaster to check user info in cosmosDB, incase it is new user, create the user in cosmosDB
    msalHelper.callAPI("accountManagement/fetchUserAccount")
}

mainUI.prototype.showModuleButtons=function(){
    $('#githublink').remove()
    $('#signInBtn').remove()
    $('#descriptionPart').remove()
    $('#footerPart').remove()

    //$('#headerPart').empty()
    var deviceManageBtn=$('<button class="w3-button w3-hover-amber w3-ripple w3-card w3-padding-16 w3-margin-bottom" style="width:550px;display:block">Device Management</button>')
    var adtUIBtn=$('<button class="w3-button w3-hover-amber w3-ripple w3-card w3-padding-16 w3-margin-bottom" style="width:550px;display:block">Digital Twin</button>')
    var eventLogBtn=$('<button class="w3-button w3-hover-amber w3-ripple w3-card w3-padding-16 w3-margin-bottom" style="width:550px;display:block">Event Log</button>')
    var logoutBtn=$('<button class="w3-button w3-black w3-ripple w3-card w3-padding-16 w3-margin-bottom" style="width:350px;display:block;margin-left:100px;margin-top:32px">Sign Out</button>')
    
    $('#headerPart').append($('<div style="width:50%" class="w3-container  w3-cell "></div><div id="middleDIV" class="w3-container w3-cell w3-cell-middle" style="height:50vh"></div><div style="width:50%" class="w3-container w3-cell">'))
    $('#middleDIV').append(deviceManageBtn,adtUIBtn,eventLogBtn,logoutBtn) 

    logoutBtn.on("click",()=>{
        //TODO: if logout from the modules page, should redirect to the spaindex.html page
        const logoutRequest = {
            postLogoutRedirectUri: globalAppSettings.logoutRedirectUri,
            mainWindowRedirectUri: globalAppSettings.logoutRedirectUri
        };
    
        this.myMSALObj.logoutPopup(logoutRequest);
    })

    adtUIBtn.on("click",()=>{
        window.open("digitaltwinmodule.html", "_blank");
    })

    //if this page is open in localhost environment, add three buttons to allow pages opening and using local running api app instead
    // of cloud api app in azure app service. In production environment, these buttons will never show
    if(window.location.href.startsWith("http://localhost")){
        var deviceManageLocalAPIBtn=$('<button class="w3-button w3-dark-grey w3-card w3-padding-16 w3-margin-bottom" >Device Management(Local API)</button>')
        var adtUILocalAPIBtn=$('<button class="w3-button w3-dark-grey w3-card w3-padding-16 w3-margin-bottom">Digital Twin(Local API)</button>')
        var eventLogLocalAPIBtn=$('<button class="w3-button w3-dark-grey w3-card w3-padding-16 w3-margin-bottom">Event Log(Local API)</button>')
        $('#middleDIV').append(deviceManageLocalAPIBtn,adtUILocalAPIBtn,eventLogLocalAPIBtn) 

        adtUILocalAPIBtn.on("click",()=>{
            window.open("digitaltwinmodule.html?test=1", "_blank");
        })
    }
    
}

module.exports = new mainUI();
},{"./globalAppSettings":1,"./msalHelper":3}],3:[function(require,module,exports){
const globalAppSettings=require("./globalAppSettings")

function msalHelper(){
    this.myMSALObj = new msal.PublicClientApplication(globalAppSettings.msalConfig);
}

msalHelper.prototype.signIn=async function(){
    try{
        var response= await this.myMSALObj.loginPopup({ scopes:[]  }) //globalAppSettings.b2cScopes
        console.log(response)
        if (response != null){
            this.setAccount(response.account)
            return response.account
        } 
        else  return this.fetchAccount()
    }catch(e){
        if(e.errorCode!="user_cancelled") console.log(e)
    }
}

msalHelper.prototype.setAccount=function(theAccount){
    if(theAccount==null)return;
    this.accountId = theAccount.homeAccountId;
    this.accountName = theAccount.username;
    this.userName=theAccount.name;
}

msalHelper.prototype.fetchAccount=function(noAnimation){
    const currentAccounts = this.myMSALObj.getAllAccounts();
    if (currentAccounts.length < 1) return;
    var foundAccount=null;
    for(var i=0;i<currentAccounts.length;i++){
        var anAccount= currentAccounts[i]
        if(anAccount.homeAccountId.toUpperCase().includes(globalAppSettings.b2cSignUpSignInName.toUpperCase())
            && anAccount.idTokenClaims.iss.toUpperCase().includes(globalAppSettings.msalConfig.auth.knownAuthorities[0].toUpperCase())
            && anAccount.idTokenClaims.aud === globalAppSettings.msalConfig.auth.clientId
        ){
            foundAccount= anAccount;
        }
    }
    this.setAccount(foundAccount)
    return foundAccount;
}


msalHelper.prototype.callAzureFunctionsService=async function(APIString,RESTMethod,payload){
    var headersObj={}
    var token=await this.getToken(globalAppSettings.b2cScope_functions)
    headersObj["Authorization"]=`Bearer ${token}`
    return new Promise((resolve, reject) => {
        var ajaxContent={
            type: RESTMethod || 'GET',
            "headers":headersObj,
            url: globalAppSettings.functionsAPIURI+APIString,
            contentType: "application/json; charset=utf-8",
            crossDomain: true,
            success: function (responseData, textStatus, jqXHR) {
                resolve(responseData)
            },
            error: function (responseData, textStatus, errorThrown) {
                reject(responseData)
            }
        }
        if(RESTMethod=="POST") ajaxContent.data= JSON.stringify(payload)
        $.ajax(ajaxContent);
    })
}

msalHelper.prototype.callAPI=async function(APIString,RESTMethod,payload){
    var headersObj={}
    if(!globalAppSettings.isLocalTest){
        var token=await this.getToken(globalAppSettings.b2cScope_taskmaster)
        headersObj["Authorization"]=`Bearer ${token}`
    }
    return new Promise((resolve, reject) => {
        var ajaxContent={
            type: RESTMethod || 'GET',
            "headers":headersObj,
            url: globalAppSettings.taskMasterAPIURI+APIString,
            contentType: "application/json; charset=utf-8",
            crossDomain: true,
            success: function (responseData, textStatus, jqXHR) {
                resolve(responseData)
            },
            error: function (responseData, textStatus, errorThrown) {
                reject(responseData)
            }
        }
        if(RESTMethod=="POST") ajaxContent.data= JSON.stringify(payload)
        $.ajax(ajaxContent);
    })
}

msalHelper.prototype.getToken=async function(b2cScope){
    try{
        if(this.storedToken==null) this.storedToken={}
        if(this.storedToken[b2cScope]!=null){
            var currTime=parseInt(new Date().getTime()/1000)
            if(currTime+60 < this.storedToken[b2cScope].expire) return this.storedToken[b2cScope].accessToken
        }
        var tokenRequest={
            scopes: [b2cScope],
            forceRefresh: false, // Set this to "true" to skip a cached token and go to the server to get a new token
            account: this.myMSALObj.getAccountByHomeId(this.accountId)
        }
    
        var response = await this.myMSALObj.acquireTokenSilent(tokenRequest)
        if (!response.accessToken || response.accessToken === "") {
            throw new msal.InteractionRequiredAuthError;
        }
        this.storedToken[b2cScope]={"accessToken":response.accessToken,"expire":response.idTokenClaims.exp}
    }catch(error){
        if (error instanceof msal.InteractionRequiredAuthError) {
            // fallback to interaction when silent call fails
            var response=await this.myMSALObj.acquireTokenPopup(tokenRequest)
        } else {
            throw error;
        }
    }

    return response.accessToken;
}

module.exports = new msalHelper();
},{"./globalAppSettings":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2dsb2JhbEFwcFNldHRpbmdzLmpzIiwiLi4vc3BhU291cmNlQ29kZS9tYWluVUkuanMiLCIuLi9zcGFTb3VyY2VDb2RlL21zYWxIZWxwZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiY29uc3Qgc2lnbnVwc2lnbmlubmFtZT1cIkIyQ18xX3Npbmd1cHNpZ25pbl9zcGFhcHAxXCJcclxuY29uc3QgYjJjVGVuYW50TmFtZT1cImF6dXJlaW90YjJjXCJcclxuXHJcbmNvbnN0IHVybCA9IG5ldyBVUkwod2luZG93LmxvY2F0aW9uLmhyZWYpO1xyXG5cclxudmFyIHN0ckFycj13aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdChcIj9cIilcclxudmFyIGlzTG9jYWxUZXN0PShzdHJBcnIuaW5kZXhPZihcInRlc3Q9MVwiKSE9LTEpXHJcblxyXG5jb25zdCBnbG9iYWxBcHBTZXR0aW5ncz17XHJcbiAgICBcImIyY1NpZ25VcFNpZ25Jbk5hbWVcIjogc2lnbnVwc2lnbmlubmFtZSxcclxuICAgIFwiYjJjU2NvcGVfdGFza21hc3RlclwiOlwiaHR0cHM6Ly9cIitiMmNUZW5hbnROYW1lK1wiLm9ubWljcm9zb2Z0LmNvbS90YXNrbWFzdGVybW9kdWxlL29wZXJhdGlvblwiLFxyXG4gICAgXCJiMmNTY29wZV9mdW5jdGlvbnNcIjpcImh0dHBzOi8vXCIrYjJjVGVuYW50TmFtZStcIi5vbm1pY3Jvc29mdC5jb20vYXp1cmVpb3Ryb2Nrc2Z1bmN0aW9ucy9iYXNpY1wiLFxyXG4gICAgXCJsb2dvdXRSZWRpcmVjdFVyaVwiOiB1cmwub3JpZ2luK1wiL3NwYWluZGV4Lmh0bWxcIixcclxuICAgIFwibXNhbENvbmZpZ1wiOntcclxuICAgICAgICBhdXRoOiB7XHJcbiAgICAgICAgICAgIGNsaWVudElkOiBcImY0NjkzYmU1LTYwMWItNGQwZS05MjA4LWMzNWQ5YWQ2MjM4N1wiLFxyXG4gICAgICAgICAgICBhdXRob3JpdHk6IFwiaHR0cHM6Ly9cIitiMmNUZW5hbnROYW1lK1wiLmIyY2xvZ2luLmNvbS9cIitiMmNUZW5hbnROYW1lK1wiLm9ubWljcm9zb2Z0LmNvbS9cIitzaWdudXBzaWduaW5uYW1lLFxyXG4gICAgICAgICAgICBrbm93bkF1dGhvcml0aWVzOiBbYjJjVGVuYW50TmFtZStcIi5iMmNsb2dpbi5jb21cIl0sXHJcbiAgICAgICAgICAgIHJlZGlyZWN0VXJpOiB3aW5kb3cubG9jYXRpb24uaHJlZlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY2FjaGU6IHtcclxuICAgICAgICAgICAgY2FjaGVMb2NhdGlvbjogXCJzZXNzaW9uU3RvcmFnZVwiLCBcclxuICAgICAgICAgICAgc3RvcmVBdXRoU3RhdGVJbkNvb2tpZTogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIHN5c3RlbToge1xyXG4gICAgICAgICAgICBsb2dnZXJPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBsb2dnZXJDYWxsYmFjazogKGxldmVsLCBtZXNzYWdlLCBjb250YWluc1BpaSkgPT4ge31cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcImlzTG9jYWxUZXN0XCI6aXNMb2NhbFRlc3QsXHJcbiAgICBcInRhc2tNYXN0ZXJBUElVUklcIjooKGlzTG9jYWxUZXN0KT9cImh0dHA6Ly9sb2NhbGhvc3Q6NTAwMi9cIjpcImh0dHBzOi8vYXp1cmVpb3Ryb2Nrc3Rhc2ttYXN0ZXJtb2R1bGUuYXp1cmV3ZWJzaXRlcy5uZXQvXCIpLFxyXG4gICAgXCJmdW5jdGlvbnNBUElVUklcIjpcImh0dHBzOi8vYXp1cmVpb3Ryb2Nrc2Z1bmN0aW9ucy5henVyZXdlYnNpdGVzLm5ldC9hcGkvXCJcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBnbG9iYWxBcHBTZXR0aW5nczsiLCIvL3RoZSBTdGFydCBwYWdlIGlzIHRoZSBzaWduIGluIHBhZ2VcclxuY29uc3QgZ2xvYmFsQXBwU2V0dGluZ3M9cmVxdWlyZShcIi4vZ2xvYmFsQXBwU2V0dGluZ3NcIilcclxuY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi9tc2FsSGVscGVyXCIpXHJcblxyXG5mdW5jdGlvbiBtYWluVUkoKSB7XHJcbiAgICB0aGlzLm15TVNBTE9iaiA9IG5ldyBtc2FsLlB1YmxpY0NsaWVudEFwcGxpY2F0aW9uKGdsb2JhbEFwcFNldHRpbmdzLm1zYWxDb25maWcpO1xyXG4gICAgJCgnI3NpZ25JbkJ0bicpLm9uKFwiY2xpY2tcIixhc3luYyAoKT0+e1xyXG4gICAgICAgIHZhciB0aGVBY2NvdW50PWF3YWl0IG1zYWxIZWxwZXIuc2lnbkluKClcclxuICAgICAgICBpZih0aGVBY2NvdW50IT1udWxsKSB0aGlzLmFmdGVyU2lnbmVkSW4odGhlQWNjb3VudCk7XHJcbiAgICB9KVxyXG4gICAgLy9pbiBjYXNlIG9mIHBhZ2UgcmVmcmVzaCBhbmQgaXQgbWlnaHQgYmUgb2sgdG8gZmV0Y2ggYWNjb3VudCBkaXJlY3RseSBmcm9tIGNhY2hlXHJcbiAgICB2YXIgdGhlQWNjb3VudD1tc2FsSGVscGVyLmZldGNoQWNjb3VudCgpOyBcclxuXHJcbiAgICBpZih0aGVBY2NvdW50IT1udWxsKSB0aGlzLmFmdGVyU2lnbmVkSW4odGhlQWNjb3VudCxcIm5vQW5pbWF0aW9uXCIpXHJcbn1cclxuXHJcbm1haW5VSS5wcm90b3R5cGUuYWZ0ZXJTaWduZWRJbj1hc3luYyBmdW5jdGlvbihhbkFjY291bnQsbm9BbmltYXRpb24pe1xyXG4gICAgaWYobm9BbmltYXRpb24pe1xyXG4gICAgICAgICQoJyNoZWFkZXJQYXJ0JykuY3NzKHtoZWlnaHQ6XCIxMDB2aFwiLFwicGFkZGluZ1wiOlwiMTVweFwifSlcclxuICAgICAgICB0aGlzLnNob3dNb2R1bGVCdXR0b25zKClcclxuICAgIH1lbHNle1xyXG4gICAgICAgICQoJyNoZWFkZXJQYXJ0JykuYW5pbWF0ZSh7aGVpZ2h0OlwiMTAwdmhcIn0pXHJcbiAgICAgICAgJCgnI2dpdGh1YmxpbmsnKS5hbmltYXRlKHtvcGFjaXR5OlwiMFwifSlcclxuICAgICAgICAkKCcjc2lnbkluQnRuJykuYW5pbWF0ZSh7b3BhY2l0eTpcIjBcIn0pXHJcbiAgICAgICAgJCgnI2Zvb3RlclBhcnQnKS5hbmltYXRlKHtvcGFjaXR5OlwiMFwifSwoKT0+e3RoaXMuc2hvd01vZHVsZUJ1dHRvbnMoKX0pXHJcbiAgICAgICAgJCgnI2hlYWRlclBhcnQnKS5hbmltYXRlKHtcInBhZGRpbmdcIjpcIjE1cHhcIn0pXHJcbiAgICB9XHJcblxyXG4gICAgLy9hbHNvIG5vdGlmeSB0YXNrbWFzdGVyIHRvIGNoZWNrIHVzZXIgaW5mbyBpbiBjb3Ntb3NEQiwgaW5jYXNlIGl0IGlzIG5ldyB1c2VyLCBjcmVhdGUgdGhlIHVzZXIgaW4gY29zbW9zREJcclxuICAgIG1zYWxIZWxwZXIuY2FsbEFQSShcImFjY291bnRNYW5hZ2VtZW50L2ZldGNoVXNlckFjY291bnRcIilcclxufVxyXG5cclxubWFpblVJLnByb3RvdHlwZS5zaG93TW9kdWxlQnV0dG9ucz1mdW5jdGlvbigpe1xyXG4gICAgJCgnI2dpdGh1YmxpbmsnKS5yZW1vdmUoKVxyXG4gICAgJCgnI3NpZ25JbkJ0bicpLnJlbW92ZSgpXHJcbiAgICAkKCcjZGVzY3JpcHRpb25QYXJ0JykucmVtb3ZlKClcclxuICAgICQoJyNmb290ZXJQYXJ0JykucmVtb3ZlKClcclxuXHJcbiAgICAvLyQoJyNoZWFkZXJQYXJ0JykuZW1wdHkoKVxyXG4gICAgdmFyIGRldmljZU1hbmFnZUJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyIHczLXJpcHBsZSB3My1jYXJkIHczLXBhZGRpbmctMTYgdzMtbWFyZ2luLWJvdHRvbVwiIHN0eWxlPVwid2lkdGg6NTUwcHg7ZGlzcGxheTpibG9ja1wiPkRldmljZSBNYW5hZ2VtZW50PC9idXR0b24+JylcclxuICAgIHZhciBhZHRVSUJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyIHczLXJpcHBsZSB3My1jYXJkIHczLXBhZGRpbmctMTYgdzMtbWFyZ2luLWJvdHRvbVwiIHN0eWxlPVwid2lkdGg6NTUwcHg7ZGlzcGxheTpibG9ja1wiPkRpZ2l0YWwgVHdpbjwvYnV0dG9uPicpXHJcbiAgICB2YXIgZXZlbnRMb2dCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ob3Zlci1hbWJlciB3My1yaXBwbGUgdzMtY2FyZCB3My1wYWRkaW5nLTE2IHczLW1hcmdpbi1ib3R0b21cIiBzdHlsZT1cIndpZHRoOjU1MHB4O2Rpc3BsYXk6YmxvY2tcIj5FdmVudCBMb2c8L2J1dHRvbj4nKVxyXG4gICAgdmFyIGxvZ291dEJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJsYWNrIHczLXJpcHBsZSB3My1jYXJkIHczLXBhZGRpbmctMTYgdzMtbWFyZ2luLWJvdHRvbVwiIHN0eWxlPVwid2lkdGg6MzUwcHg7ZGlzcGxheTpibG9jazttYXJnaW4tbGVmdDoxMDBweDttYXJnaW4tdG9wOjMycHhcIj5TaWduIE91dDwvYnV0dG9uPicpXHJcbiAgICBcclxuICAgICQoJyNoZWFkZXJQYXJ0JykuYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJ3aWR0aDo1MCVcIiBjbGFzcz1cInczLWNvbnRhaW5lciAgdzMtY2VsbCBcIj48L2Rpdj48ZGl2IGlkPVwibWlkZGxlRElWXCIgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtY2VsbCB3My1jZWxsLW1pZGRsZVwiIHN0eWxlPVwiaGVpZ2h0OjUwdmhcIj48L2Rpdj48ZGl2IHN0eWxlPVwid2lkdGg6NTAlXCIgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtY2VsbFwiPicpKVxyXG4gICAgJCgnI21pZGRsZURJVicpLmFwcGVuZChkZXZpY2VNYW5hZ2VCdG4sYWR0VUlCdG4sZXZlbnRMb2dCdG4sbG9nb3V0QnRuKSBcclxuXHJcbiAgICBsb2dvdXRCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgLy9UT0RPOiBpZiBsb2dvdXQgZnJvbSB0aGUgbW9kdWxlcyBwYWdlLCBzaG91bGQgcmVkaXJlY3QgdG8gdGhlIHNwYWluZGV4Lmh0bWwgcGFnZVxyXG4gICAgICAgIGNvbnN0IGxvZ291dFJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHBvc3RMb2dvdXRSZWRpcmVjdFVyaTogZ2xvYmFsQXBwU2V0dGluZ3MubG9nb3V0UmVkaXJlY3RVcmksXHJcbiAgICAgICAgICAgIG1haW5XaW5kb3dSZWRpcmVjdFVyaTogZ2xvYmFsQXBwU2V0dGluZ3MubG9nb3V0UmVkaXJlY3RVcmlcclxuICAgICAgICB9O1xyXG4gICAgXHJcbiAgICAgICAgdGhpcy5teU1TQUxPYmoubG9nb3V0UG9wdXAobG9nb3V0UmVxdWVzdCk7XHJcbiAgICB9KVxyXG5cclxuICAgIGFkdFVJQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIHdpbmRvdy5vcGVuKFwiZGlnaXRhbHR3aW5tb2R1bGUuaHRtbFwiLCBcIl9ibGFua1wiKTtcclxuICAgIH0pXHJcblxyXG4gICAgLy9pZiB0aGlzIHBhZ2UgaXMgb3BlbiBpbiBsb2NhbGhvc3QgZW52aXJvbm1lbnQsIGFkZCB0aHJlZSBidXR0b25zIHRvIGFsbG93IHBhZ2VzIG9wZW5pbmcgYW5kIHVzaW5nIGxvY2FsIHJ1bm5pbmcgYXBpIGFwcCBpbnN0ZWFkXHJcbiAgICAvLyBvZiBjbG91ZCBhcGkgYXBwIGluIGF6dXJlIGFwcCBzZXJ2aWNlLiBJbiBwcm9kdWN0aW9uIGVudmlyb25tZW50LCB0aGVzZSBidXR0b25zIHdpbGwgbmV2ZXIgc2hvd1xyXG4gICAgaWYod2luZG93LmxvY2F0aW9uLmhyZWYuc3RhcnRzV2l0aChcImh0dHA6Ly9sb2NhbGhvc3RcIikpe1xyXG4gICAgICAgIHZhciBkZXZpY2VNYW5hZ2VMb2NhbEFQSUJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWRhcmstZ3JleSB3My1jYXJkIHczLXBhZGRpbmctMTYgdzMtbWFyZ2luLWJvdHRvbVwiID5EZXZpY2UgTWFuYWdlbWVudChMb2NhbCBBUEkpPC9idXR0b24+JylcclxuICAgICAgICB2YXIgYWR0VUlMb2NhbEFQSUJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWRhcmstZ3JleSB3My1jYXJkIHczLXBhZGRpbmctMTYgdzMtbWFyZ2luLWJvdHRvbVwiPkRpZ2l0YWwgVHdpbihMb2NhbCBBUEkpPC9idXR0b24+JylcclxuICAgICAgICB2YXIgZXZlbnRMb2dMb2NhbEFQSUJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWRhcmstZ3JleSB3My1jYXJkIHczLXBhZGRpbmctMTYgdzMtbWFyZ2luLWJvdHRvbVwiPkV2ZW50IExvZyhMb2NhbCBBUEkpPC9idXR0b24+JylcclxuICAgICAgICAkKCcjbWlkZGxlRElWJykuYXBwZW5kKGRldmljZU1hbmFnZUxvY2FsQVBJQnRuLGFkdFVJTG9jYWxBUElCdG4sZXZlbnRMb2dMb2NhbEFQSUJ0bikgXHJcblxyXG4gICAgICAgIGFkdFVJTG9jYWxBUElCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgICAgIHdpbmRvdy5vcGVuKFwiZGlnaXRhbHR3aW5tb2R1bGUuaHRtbD90ZXN0PTFcIiwgXCJfYmxhbmtcIik7XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIFxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBtYWluVUkoKTsiLCJjb25zdCBnbG9iYWxBcHBTZXR0aW5ncz1yZXF1aXJlKFwiLi9nbG9iYWxBcHBTZXR0aW5nc1wiKVxyXG5cclxuZnVuY3Rpb24gbXNhbEhlbHBlcigpe1xyXG4gICAgdGhpcy5teU1TQUxPYmogPSBuZXcgbXNhbC5QdWJsaWNDbGllbnRBcHBsaWNhdGlvbihnbG9iYWxBcHBTZXR0aW5ncy5tc2FsQ29uZmlnKTtcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuc2lnbkluPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIHJlc3BvbnNlPSBhd2FpdCB0aGlzLm15TVNBTE9iai5sb2dpblBvcHVwKHsgc2NvcGVzOltdICB9KSAvL2dsb2JhbEFwcFNldHRpbmdzLmIyY1Njb3Blc1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKVxyXG4gICAgICAgIGlmIChyZXNwb25zZSAhPSBudWxsKXtcclxuICAgICAgICAgICAgdGhpcy5zZXRBY2NvdW50KHJlc3BvbnNlLmFjY291bnQpXHJcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5hY2NvdW50XHJcbiAgICAgICAgfSBcclxuICAgICAgICBlbHNlICByZXR1cm4gdGhpcy5mZXRjaEFjY291bnQoKVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGlmKGUuZXJyb3JDb2RlIT1cInVzZXJfY2FuY2VsbGVkXCIpIGNvbnNvbGUubG9nKGUpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLnNldEFjY291bnQ9ZnVuY3Rpb24odGhlQWNjb3VudCl7XHJcbiAgICBpZih0aGVBY2NvdW50PT1udWxsKXJldHVybjtcclxuICAgIHRoaXMuYWNjb3VudElkID0gdGhlQWNjb3VudC5ob21lQWNjb3VudElkO1xyXG4gICAgdGhpcy5hY2NvdW50TmFtZSA9IHRoZUFjY291bnQudXNlcm5hbWU7XHJcbiAgICB0aGlzLnVzZXJOYW1lPXRoZUFjY291bnQubmFtZTtcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuZmV0Y2hBY2NvdW50PWZ1bmN0aW9uKG5vQW5pbWF0aW9uKXtcclxuICAgIGNvbnN0IGN1cnJlbnRBY2NvdW50cyA9IHRoaXMubXlNU0FMT2JqLmdldEFsbEFjY291bnRzKCk7XHJcbiAgICBpZiAoY3VycmVudEFjY291bnRzLmxlbmd0aCA8IDEpIHJldHVybjtcclxuICAgIHZhciBmb3VuZEFjY291bnQ9bnVsbDtcclxuICAgIGZvcih2YXIgaT0wO2k8Y3VycmVudEFjY291bnRzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBhbkFjY291bnQ9IGN1cnJlbnRBY2NvdW50c1tpXVxyXG4gICAgICAgIGlmKGFuQWNjb3VudC5ob21lQWNjb3VudElkLnRvVXBwZXJDYXNlKCkuaW5jbHVkZXMoZ2xvYmFsQXBwU2V0dGluZ3MuYjJjU2lnblVwU2lnbkluTmFtZS50b1VwcGVyQ2FzZSgpKVxyXG4gICAgICAgICAgICAmJiBhbkFjY291bnQuaWRUb2tlbkNsYWltcy5pc3MudG9VcHBlckNhc2UoKS5pbmNsdWRlcyhnbG9iYWxBcHBTZXR0aW5ncy5tc2FsQ29uZmlnLmF1dGgua25vd25BdXRob3JpdGllc1swXS50b1VwcGVyQ2FzZSgpKVxyXG4gICAgICAgICAgICAmJiBhbkFjY291bnQuaWRUb2tlbkNsYWltcy5hdWQgPT09IGdsb2JhbEFwcFNldHRpbmdzLm1zYWxDb25maWcuYXV0aC5jbGllbnRJZFxyXG4gICAgICAgICl7XHJcbiAgICAgICAgICAgIGZvdW5kQWNjb3VudD0gYW5BY2NvdW50O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuc2V0QWNjb3VudChmb3VuZEFjY291bnQpXHJcbiAgICByZXR1cm4gZm91bmRBY2NvdW50O1xyXG59XHJcblxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuY2FsbEF6dXJlRnVuY3Rpb25zU2VydmljZT1hc3luYyBmdW5jdGlvbihBUElTdHJpbmcsUkVTVE1ldGhvZCxwYXlsb2FkKXtcclxuICAgIHZhciBoZWFkZXJzT2JqPXt9XHJcbiAgICB2YXIgdG9rZW49YXdhaXQgdGhpcy5nZXRUb2tlbihnbG9iYWxBcHBTZXR0aW5ncy5iMmNTY29wZV9mdW5jdGlvbnMpXHJcbiAgICBoZWFkZXJzT2JqW1wiQXV0aG9yaXphdGlvblwiXT1gQmVhcmVyICR7dG9rZW59YFxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB2YXIgYWpheENvbnRlbnQ9e1xyXG4gICAgICAgICAgICB0eXBlOiBSRVNUTWV0aG9kIHx8ICdHRVQnLFxyXG4gICAgICAgICAgICBcImhlYWRlcnNcIjpoZWFkZXJzT2JqLFxyXG4gICAgICAgICAgICB1cmw6IGdsb2JhbEFwcFNldHRpbmdzLmZ1bmN0aW9uc0FQSVVSSStBUElTdHJpbmcsXHJcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcclxuICAgICAgICAgICAgY3Jvc3NEb21haW46IHRydWUsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwb25zZURhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlRGF0YSlcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZURhdGEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QocmVzcG9uc2VEYXRhKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKFJFU1RNZXRob2Q9PVwiUE9TVFwiKSBhamF4Q29udGVudC5kYXRhPSBKU09OLnN0cmluZ2lmeShwYXlsb2FkKVxyXG4gICAgICAgICQuYWpheChhamF4Q29udGVudCk7XHJcbiAgICB9KVxyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5jYWxsQVBJPWFzeW5jIGZ1bmN0aW9uKEFQSVN0cmluZyxSRVNUTWV0aG9kLHBheWxvYWQpe1xyXG4gICAgdmFyIGhlYWRlcnNPYmo9e31cclxuICAgIGlmKCFnbG9iYWxBcHBTZXR0aW5ncy5pc0xvY2FsVGVzdCl7XHJcbiAgICAgICAgdmFyIHRva2VuPWF3YWl0IHRoaXMuZ2V0VG9rZW4oZ2xvYmFsQXBwU2V0dGluZ3MuYjJjU2NvcGVfdGFza21hc3RlcilcclxuICAgICAgICBoZWFkZXJzT2JqW1wiQXV0aG9yaXphdGlvblwiXT1gQmVhcmVyICR7dG9rZW59YFxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB2YXIgYWpheENvbnRlbnQ9e1xyXG4gICAgICAgICAgICB0eXBlOiBSRVNUTWV0aG9kIHx8ICdHRVQnLFxyXG4gICAgICAgICAgICBcImhlYWRlcnNcIjpoZWFkZXJzT2JqLFxyXG4gICAgICAgICAgICB1cmw6IGdsb2JhbEFwcFNldHRpbmdzLnRhc2tNYXN0ZXJBUElVUkkrQVBJU3RyaW5nLFxyXG4gICAgICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXHJcbiAgICAgICAgICAgIGNyb3NzRG9tYWluOiB0cnVlLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcG9uc2VEYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwb25zZURhdGEpXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2VEYXRhLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KHJlc3BvbnNlRGF0YSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihSRVNUTWV0aG9kPT1cIlBPU1RcIikgYWpheENvbnRlbnQuZGF0YT0gSlNPTi5zdHJpbmdpZnkocGF5bG9hZClcclxuICAgICAgICAkLmFqYXgoYWpheENvbnRlbnQpO1xyXG4gICAgfSlcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuZ2V0VG9rZW49YXN5bmMgZnVuY3Rpb24oYjJjU2NvcGUpe1xyXG4gICAgdHJ5e1xyXG4gICAgICAgIGlmKHRoaXMuc3RvcmVkVG9rZW49PW51bGwpIHRoaXMuc3RvcmVkVG9rZW49e31cclxuICAgICAgICBpZih0aGlzLnN0b3JlZFRva2VuW2IyY1Njb3BlXSE9bnVsbCl7XHJcbiAgICAgICAgICAgIHZhciBjdXJyVGltZT1wYXJzZUludChuZXcgRGF0ZSgpLmdldFRpbWUoKS8xMDAwKVxyXG4gICAgICAgICAgICBpZihjdXJyVGltZSs2MCA8IHRoaXMuc3RvcmVkVG9rZW5bYjJjU2NvcGVdLmV4cGlyZSkgcmV0dXJuIHRoaXMuc3RvcmVkVG9rZW5bYjJjU2NvcGVdLmFjY2Vzc1Rva2VuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB0b2tlblJlcXVlc3Q9e1xyXG4gICAgICAgICAgICBzY29wZXM6IFtiMmNTY29wZV0sXHJcbiAgICAgICAgICAgIGZvcmNlUmVmcmVzaDogZmFsc2UsIC8vIFNldCB0aGlzIHRvIFwidHJ1ZVwiIHRvIHNraXAgYSBjYWNoZWQgdG9rZW4gYW5kIGdvIHRvIHRoZSBzZXJ2ZXIgdG8gZ2V0IGEgbmV3IHRva2VuXHJcbiAgICAgICAgICAgIGFjY291bnQ6IHRoaXMubXlNU0FMT2JqLmdldEFjY291bnRCeUhvbWVJZCh0aGlzLmFjY291bnRJZClcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICB2YXIgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLm15TVNBTE9iai5hY3F1aXJlVG9rZW5TaWxlbnQodG9rZW5SZXF1ZXN0KVxyXG4gICAgICAgIGlmICghcmVzcG9uc2UuYWNjZXNzVG9rZW4gfHwgcmVzcG9uc2UuYWNjZXNzVG9rZW4gPT09IFwiXCIpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IG1zYWwuSW50ZXJhY3Rpb25SZXF1aXJlZEF1dGhFcnJvcjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zdG9yZWRUb2tlbltiMmNTY29wZV09e1wiYWNjZXNzVG9rZW5cIjpyZXNwb25zZS5hY2Nlc3NUb2tlbixcImV4cGlyZVwiOnJlc3BvbnNlLmlkVG9rZW5DbGFpbXMuZXhwfVxyXG4gICAgfWNhdGNoKGVycm9yKXtcclxuICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBtc2FsLkludGVyYWN0aW9uUmVxdWlyZWRBdXRoRXJyb3IpIHtcclxuICAgICAgICAgICAgLy8gZmFsbGJhY2sgdG8gaW50ZXJhY3Rpb24gd2hlbiBzaWxlbnQgY2FsbCBmYWlsc1xyXG4gICAgICAgICAgICB2YXIgcmVzcG9uc2U9YXdhaXQgdGhpcy5teU1TQUxPYmouYWNxdWlyZVRva2VuUG9wdXAodG9rZW5SZXF1ZXN0KVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuYWNjZXNzVG9rZW47XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1zYWxIZWxwZXIoKTsiXX0=
