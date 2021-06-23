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

    deviceManageBtn.on("click",()=>{
        window.open("devicemanagement.html", "_blank");
    })

    eventLogBtn.on("click",()=>{
        window.open("eventlogmodule.html", "_blank");
    })
 
    //if this page is open in localhost environment, add three buttons to allow pages opening and using local running api app instead
    // of cloud api app in azure app service. In production environment, these buttons will never show
    /*
    if(window.location.href.startsWith("http://localhost")){
        var deviceManageLocalAPIBtn=$('<button class="w3-button w3-dark-grey w3-card w3-padding-16 w3-margin-bottom" >Device Management(Local API)</button>')
        var adtUILocalAPIBtn=$('<button class="w3-button w3-dark-grey w3-card w3-padding-16 w3-margin-bottom">Digital Twin(Local API)</button>')
        var eventLogLocalAPIBtn=$('<button class="w3-button w3-dark-grey w3-card w3-padding-16 w3-margin-bottom">Event Log(Local API)</button>')
        $('#middleDIV').append(deviceManageLocalAPIBtn,adtUILocalAPIBtn,eventLogLocalAPIBtn) 

        adtUILocalAPIBtn.on("click",()=>{
            window.open("digitaltwinmodule.html?test=1", "_blank");
        })
    }
    */
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
        try{
            var token=await this.getToken(globalAppSettings.b2cScope_taskmaster)
        }catch(e){
            window.open(globalAppSettings.logoutRedirectUri,"_self")
        }
        
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2dsb2JhbEFwcFNldHRpbmdzLmpzIiwiLi4vc3BhU291cmNlQ29kZS9tYWluVUkuanMiLCIuLi9zcGFTb3VyY2VDb2RlL21zYWxIZWxwZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImNvbnN0IHNpZ251cHNpZ25pbm5hbWU9XCJCMkNfMV9zaW5ndXBzaWduaW5fc3BhYXBwMVwiXHJcbmNvbnN0IGIyY1RlbmFudE5hbWU9XCJhenVyZWlvdGIyY1wiXHJcblxyXG5jb25zdCB1cmwgPSBuZXcgVVJMKHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcclxuXHJcbnZhciBzdHJBcnI9d2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoXCI/XCIpXHJcbnZhciBpc0xvY2FsVGVzdD0oc3RyQXJyLmluZGV4T2YoXCJ0ZXN0PTFcIikhPS0xKVxyXG5cclxuY29uc3QgZ2xvYmFsQXBwU2V0dGluZ3M9e1xyXG4gICAgXCJiMmNTaWduVXBTaWduSW5OYW1lXCI6IHNpZ251cHNpZ25pbm5hbWUsXHJcbiAgICBcImIyY1Njb3BlX3Rhc2ttYXN0ZXJcIjpcImh0dHBzOi8vXCIrYjJjVGVuYW50TmFtZStcIi5vbm1pY3Jvc29mdC5jb20vdGFza21hc3Rlcm1vZHVsZS9vcGVyYXRpb25cIixcclxuICAgIFwiYjJjU2NvcGVfZnVuY3Rpb25zXCI6XCJodHRwczovL1wiK2IyY1RlbmFudE5hbWUrXCIub25taWNyb3NvZnQuY29tL2F6dXJlaW90cm9ja3NmdW5jdGlvbnMvYmFzaWNcIixcclxuICAgIFwibG9nb3V0UmVkaXJlY3RVcmlcIjogdXJsLm9yaWdpbitcIi9zcGFpbmRleC5odG1sXCIsXHJcbiAgICBcIm1zYWxDb25maWdcIjp7XHJcbiAgICAgICAgYXV0aDoge1xyXG4gICAgICAgICAgICBjbGllbnRJZDogXCJmNDY5M2JlNS02MDFiLTRkMGUtOTIwOC1jMzVkOWFkNjIzODdcIixcclxuICAgICAgICAgICAgYXV0aG9yaXR5OiBcImh0dHBzOi8vXCIrYjJjVGVuYW50TmFtZStcIi5iMmNsb2dpbi5jb20vXCIrYjJjVGVuYW50TmFtZStcIi5vbm1pY3Jvc29mdC5jb20vXCIrc2lnbnVwc2lnbmlubmFtZSxcclxuICAgICAgICAgICAga25vd25BdXRob3JpdGllczogW2IyY1RlbmFudE5hbWUrXCIuYjJjbG9naW4uY29tXCJdLFxyXG4gICAgICAgICAgICByZWRpcmVjdFVyaTogd2luZG93LmxvY2F0aW9uLmhyZWZcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNhY2hlOiB7XHJcbiAgICAgICAgICAgIGNhY2hlTG9jYXRpb246IFwic2Vzc2lvblN0b3JhZ2VcIiwgXHJcbiAgICAgICAgICAgIHN0b3JlQXV0aFN0YXRlSW5Db29raWU6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzeXN0ZW06IHtcclxuICAgICAgICAgICAgbG9nZ2VyT3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgbG9nZ2VyQ2FsbGJhY2s6IChsZXZlbCwgbWVzc2FnZSwgY29udGFpbnNQaWkpID0+IHt9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXCJpc0xvY2FsVGVzdFwiOmlzTG9jYWxUZXN0LFxyXG4gICAgXCJ0YXNrTWFzdGVyQVBJVVJJXCI6KChpc0xvY2FsVGVzdCk/XCJodHRwOi8vbG9jYWxob3N0OjUwMDIvXCI6XCJodHRwczovL2F6dXJlaW90cm9ja3N0YXNrbWFzdGVybW9kdWxlLmF6dXJld2Vic2l0ZXMubmV0L1wiKSxcclxuICAgIFwiZnVuY3Rpb25zQVBJVVJJXCI6XCJodHRwczovL2F6dXJlaW90cm9ja3NmdW5jdGlvbnMuYXp1cmV3ZWJzaXRlcy5uZXQvYXBpL1wiXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZ2xvYmFsQXBwU2V0dGluZ3M7IiwiLy90aGUgU3RhcnQgcGFnZSBpcyB0aGUgc2lnbiBpbiBwYWdlXHJcbmNvbnN0IGdsb2JhbEFwcFNldHRpbmdzPXJlcXVpcmUoXCIuL2dsb2JhbEFwcFNldHRpbmdzXCIpXHJcbmNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4vbXNhbEhlbHBlclwiKVxyXG5cclxuZnVuY3Rpb24gbWFpblVJKCkge1xyXG4gICAgdGhpcy5teU1TQUxPYmogPSBuZXcgbXNhbC5QdWJsaWNDbGllbnRBcHBsaWNhdGlvbihnbG9iYWxBcHBTZXR0aW5ncy5tc2FsQ29uZmlnKTtcclxuICAgICQoJyNzaWduSW5CdG4nKS5vbihcImNsaWNrXCIsYXN5bmMgKCk9PntcclxuICAgICAgICB2YXIgdGhlQWNjb3VudD1hd2FpdCBtc2FsSGVscGVyLnNpZ25JbigpXHJcbiAgICAgICAgaWYodGhlQWNjb3VudCE9bnVsbCkgdGhpcy5hZnRlclNpZ25lZEluKHRoZUFjY291bnQpO1xyXG4gICAgfSlcclxuICAgIC8vaW4gY2FzZSBvZiBwYWdlIHJlZnJlc2ggYW5kIGl0IG1pZ2h0IGJlIG9rIHRvIGZldGNoIGFjY291bnQgZGlyZWN0bHkgZnJvbSBjYWNoZVxyXG4gICAgdmFyIHRoZUFjY291bnQ9bXNhbEhlbHBlci5mZXRjaEFjY291bnQoKTsgXHJcblxyXG4gICAgaWYodGhlQWNjb3VudCE9bnVsbCkgdGhpcy5hZnRlclNpZ25lZEluKHRoZUFjY291bnQsXCJub0FuaW1hdGlvblwiKVxyXG59XHJcblxyXG5tYWluVUkucHJvdG90eXBlLmFmdGVyU2lnbmVkSW49YXN5bmMgZnVuY3Rpb24oYW5BY2NvdW50LG5vQW5pbWF0aW9uKXtcclxuICAgIGlmKG5vQW5pbWF0aW9uKXtcclxuICAgICAgICAkKCcjaGVhZGVyUGFydCcpLmNzcyh7aGVpZ2h0OlwiMTAwdmhcIixcInBhZGRpbmdcIjpcIjE1cHhcIn0pXHJcbiAgICAgICAgdGhpcy5zaG93TW9kdWxlQnV0dG9ucygpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICAkKCcjaGVhZGVyUGFydCcpLmFuaW1hdGUoe2hlaWdodDpcIjEwMHZoXCJ9KVxyXG4gICAgICAgICQoJyNnaXRodWJsaW5rJykuYW5pbWF0ZSh7b3BhY2l0eTpcIjBcIn0pXHJcbiAgICAgICAgJCgnI3NpZ25JbkJ0bicpLmFuaW1hdGUoe29wYWNpdHk6XCIwXCJ9KVxyXG4gICAgICAgICQoJyNmb290ZXJQYXJ0JykuYW5pbWF0ZSh7b3BhY2l0eTpcIjBcIn0sKCk9Pnt0aGlzLnNob3dNb2R1bGVCdXR0b25zKCl9KVxyXG4gICAgICAgICQoJyNoZWFkZXJQYXJ0JykuYW5pbWF0ZSh7XCJwYWRkaW5nXCI6XCIxNXB4XCJ9KVxyXG4gICAgfVxyXG5cclxuICAgIC8vYWxzbyBub3RpZnkgdGFza21hc3RlciB0byBjaGVjayB1c2VyIGluZm8gaW4gY29zbW9zREIsIGluY2FzZSBpdCBpcyBuZXcgdXNlciwgY3JlYXRlIHRoZSB1c2VyIGluIGNvc21vc0RCXHJcbiAgICBtc2FsSGVscGVyLmNhbGxBUEkoXCJhY2NvdW50TWFuYWdlbWVudC9mZXRjaFVzZXJBY2NvdW50XCIpXHJcbn1cclxuXHJcbm1haW5VSS5wcm90b3R5cGUuc2hvd01vZHVsZUJ1dHRvbnM9ZnVuY3Rpb24oKXtcclxuICAgICQoJyNnaXRodWJsaW5rJykucmVtb3ZlKClcclxuICAgICQoJyNzaWduSW5CdG4nKS5yZW1vdmUoKVxyXG4gICAgJCgnI2Rlc2NyaXB0aW9uUGFydCcpLnJlbW92ZSgpXHJcbiAgICAkKCcjZm9vdGVyUGFydCcpLnJlbW92ZSgpXHJcblxyXG4gICAgLy8kKCcjaGVhZGVyUGFydCcpLmVtcHR5KClcclxuICAgIHZhciBkZXZpY2VNYW5hZ2VCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ob3Zlci1hbWJlciB3My1yaXBwbGUgdzMtY2FyZCB3My1wYWRkaW5nLTE2IHczLW1hcmdpbi1ib3R0b21cIiBzdHlsZT1cIndpZHRoOjU1MHB4O2Rpc3BsYXk6YmxvY2tcIj5EZXZpY2UgTWFuYWdlbWVudDwvYnV0dG9uPicpXHJcbiAgICB2YXIgYWR0VUlCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ob3Zlci1hbWJlciB3My1yaXBwbGUgdzMtY2FyZCB3My1wYWRkaW5nLTE2IHczLW1hcmdpbi1ib3R0b21cIiBzdHlsZT1cIndpZHRoOjU1MHB4O2Rpc3BsYXk6YmxvY2tcIj5EaWdpdGFsIFR3aW48L2J1dHRvbj4nKVxyXG4gICAgdmFyIGV2ZW50TG9nQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtaG92ZXItYW1iZXIgdzMtcmlwcGxlIHczLWNhcmQgdzMtcGFkZGluZy0xNiB3My1tYXJnaW4tYm90dG9tXCIgc3R5bGU9XCJ3aWR0aDo1NTBweDtkaXNwbGF5OmJsb2NrXCI+RXZlbnQgTG9nPC9idXR0b24+JylcclxuICAgIHZhciBsb2dvdXRCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ibGFjayB3My1yaXBwbGUgdzMtY2FyZCB3My1wYWRkaW5nLTE2IHczLW1hcmdpbi1ib3R0b21cIiBzdHlsZT1cIndpZHRoOjM1MHB4O2Rpc3BsYXk6YmxvY2s7bWFyZ2luLWxlZnQ6MTAwcHg7bWFyZ2luLXRvcDozMnB4XCI+U2lnbiBPdXQ8L2J1dHRvbj4nKVxyXG4gICAgXHJcbiAgICAkKCcjaGVhZGVyUGFydCcpLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwid2lkdGg6NTAlXCIgY2xhc3M9XCJ3My1jb250YWluZXIgIHczLWNlbGwgXCI+PC9kaXY+PGRpdiBpZD1cIm1pZGRsZURJVlwiIGNsYXNzPVwidzMtY29udGFpbmVyIHczLWNlbGwgdzMtY2VsbC1taWRkbGVcIiBzdHlsZT1cImhlaWdodDo1MHZoXCI+PC9kaXY+PGRpdiBzdHlsZT1cIndpZHRoOjUwJVwiIGNsYXNzPVwidzMtY29udGFpbmVyIHczLWNlbGxcIj4nKSlcclxuICAgICQoJyNtaWRkbGVESVYnKS5hcHBlbmQoZGV2aWNlTWFuYWdlQnRuLGFkdFVJQnRuLGV2ZW50TG9nQnRuLGxvZ291dEJ0bikgXHJcblxyXG4gICAgbG9nb3V0QnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIC8vVE9ETzogaWYgbG9nb3V0IGZyb20gdGhlIG1vZHVsZXMgcGFnZSwgc2hvdWxkIHJlZGlyZWN0IHRvIHRoZSBzcGFpbmRleC5odG1sIHBhZ2VcclxuICAgICAgICBjb25zdCBsb2dvdXRSZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICBwb3N0TG9nb3V0UmVkaXJlY3RVcmk6IGdsb2JhbEFwcFNldHRpbmdzLmxvZ291dFJlZGlyZWN0VXJpLFxyXG4gICAgICAgICAgICBtYWluV2luZG93UmVkaXJlY3RVcmk6IGdsb2JhbEFwcFNldHRpbmdzLmxvZ291dFJlZGlyZWN0VXJpXHJcbiAgICAgICAgfTtcclxuICAgIFxyXG4gICAgICAgIHRoaXMubXlNU0FMT2JqLmxvZ291dFBvcHVwKGxvZ291dFJlcXVlc3QpO1xyXG4gICAgfSlcclxuXHJcbiAgICBhZHRVSUJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB3aW5kb3cub3BlbihcImRpZ2l0YWx0d2lubW9kdWxlLmh0bWxcIiwgXCJfYmxhbmtcIik7XHJcbiAgICB9KVxyXG5cclxuICAgIGRldmljZU1hbmFnZUJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB3aW5kb3cub3BlbihcImRldmljZW1hbmFnZW1lbnQuaHRtbFwiLCBcIl9ibGFua1wiKTtcclxuICAgIH0pXHJcblxyXG4gICAgZXZlbnRMb2dCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgd2luZG93Lm9wZW4oXCJldmVudGxvZ21vZHVsZS5odG1sXCIsIFwiX2JsYW5rXCIpO1xyXG4gICAgfSlcclxuIFxyXG4gICAgLy9pZiB0aGlzIHBhZ2UgaXMgb3BlbiBpbiBsb2NhbGhvc3QgZW52aXJvbm1lbnQsIGFkZCB0aHJlZSBidXR0b25zIHRvIGFsbG93IHBhZ2VzIG9wZW5pbmcgYW5kIHVzaW5nIGxvY2FsIHJ1bm5pbmcgYXBpIGFwcCBpbnN0ZWFkXHJcbiAgICAvLyBvZiBjbG91ZCBhcGkgYXBwIGluIGF6dXJlIGFwcCBzZXJ2aWNlLiBJbiBwcm9kdWN0aW9uIGVudmlyb25tZW50LCB0aGVzZSBidXR0b25zIHdpbGwgbmV2ZXIgc2hvd1xyXG4gICAgLypcclxuICAgIGlmKHdpbmRvdy5sb2NhdGlvbi5ocmVmLnN0YXJ0c1dpdGgoXCJodHRwOi8vbG9jYWxob3N0XCIpKXtcclxuICAgICAgICB2YXIgZGV2aWNlTWFuYWdlTG9jYWxBUElCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1kYXJrLWdyZXkgdzMtY2FyZCB3My1wYWRkaW5nLTE2IHczLW1hcmdpbi1ib3R0b21cIiA+RGV2aWNlIE1hbmFnZW1lbnQoTG9jYWwgQVBJKTwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGFkdFVJTG9jYWxBUElCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1kYXJrLWdyZXkgdzMtY2FyZCB3My1wYWRkaW5nLTE2IHczLW1hcmdpbi1ib3R0b21cIj5EaWdpdGFsIFR3aW4oTG9jYWwgQVBJKTwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGV2ZW50TG9nTG9jYWxBUElCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1kYXJrLWdyZXkgdzMtY2FyZCB3My1wYWRkaW5nLTE2IHczLW1hcmdpbi1ib3R0b21cIj5FdmVudCBMb2coTG9jYWwgQVBJKTwvYnV0dG9uPicpXHJcbiAgICAgICAgJCgnI21pZGRsZURJVicpLmFwcGVuZChkZXZpY2VNYW5hZ2VMb2NhbEFQSUJ0bixhZHRVSUxvY2FsQVBJQnRuLGV2ZW50TG9nTG9jYWxBUElCdG4pIFxyXG5cclxuICAgICAgICBhZHRVSUxvY2FsQVBJQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgICAgICB3aW5kb3cub3BlbihcImRpZ2l0YWx0d2lubW9kdWxlLmh0bWw/dGVzdD0xXCIsIFwiX2JsYW5rXCIpO1xyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICAqL1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBtYWluVUkoKTsiLCJjb25zdCBnbG9iYWxBcHBTZXR0aW5ncz1yZXF1aXJlKFwiLi9nbG9iYWxBcHBTZXR0aW5nc1wiKVxyXG5cclxuZnVuY3Rpb24gbXNhbEhlbHBlcigpe1xyXG4gICAgdGhpcy5teU1TQUxPYmogPSBuZXcgbXNhbC5QdWJsaWNDbGllbnRBcHBsaWNhdGlvbihnbG9iYWxBcHBTZXR0aW5ncy5tc2FsQ29uZmlnKTtcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuc2lnbkluPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIHJlc3BvbnNlPSBhd2FpdCB0aGlzLm15TVNBTE9iai5sb2dpblBvcHVwKHsgc2NvcGVzOltdICB9KSAvL2dsb2JhbEFwcFNldHRpbmdzLmIyY1Njb3Blc1xyXG4gICAgICAgIGlmIChyZXNwb25zZSAhPSBudWxsKXtcclxuICAgICAgICAgICAgdGhpcy5zZXRBY2NvdW50KHJlc3BvbnNlLmFjY291bnQpXHJcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5hY2NvdW50XHJcbiAgICAgICAgfSBcclxuICAgICAgICBlbHNlICByZXR1cm4gdGhpcy5mZXRjaEFjY291bnQoKVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGlmKGUuZXJyb3JDb2RlIT1cInVzZXJfY2FuY2VsbGVkXCIpIGNvbnNvbGUubG9nKGUpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLnNldEFjY291bnQ9ZnVuY3Rpb24odGhlQWNjb3VudCl7XHJcbiAgICBpZih0aGVBY2NvdW50PT1udWxsKXJldHVybjtcclxuICAgIHRoaXMuYWNjb3VudElkID0gdGhlQWNjb3VudC5ob21lQWNjb3VudElkO1xyXG4gICAgdGhpcy5hY2NvdW50TmFtZSA9IHRoZUFjY291bnQudXNlcm5hbWU7XHJcbiAgICB0aGlzLnVzZXJOYW1lPXRoZUFjY291bnQubmFtZTtcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuZmV0Y2hBY2NvdW50PWZ1bmN0aW9uKG5vQW5pbWF0aW9uKXtcclxuICAgIGNvbnN0IGN1cnJlbnRBY2NvdW50cyA9IHRoaXMubXlNU0FMT2JqLmdldEFsbEFjY291bnRzKCk7XHJcbiAgICBpZiAoY3VycmVudEFjY291bnRzLmxlbmd0aCA8IDEpIHJldHVybjtcclxuICAgIHZhciBmb3VuZEFjY291bnQ9bnVsbDtcclxuICAgIGZvcih2YXIgaT0wO2k8Y3VycmVudEFjY291bnRzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBhbkFjY291bnQ9IGN1cnJlbnRBY2NvdW50c1tpXVxyXG4gICAgICAgIGlmKGFuQWNjb3VudC5ob21lQWNjb3VudElkLnRvVXBwZXJDYXNlKCkuaW5jbHVkZXMoZ2xvYmFsQXBwU2V0dGluZ3MuYjJjU2lnblVwU2lnbkluTmFtZS50b1VwcGVyQ2FzZSgpKVxyXG4gICAgICAgICAgICAmJiBhbkFjY291bnQuaWRUb2tlbkNsYWltcy5pc3MudG9VcHBlckNhc2UoKS5pbmNsdWRlcyhnbG9iYWxBcHBTZXR0aW5ncy5tc2FsQ29uZmlnLmF1dGgua25vd25BdXRob3JpdGllc1swXS50b1VwcGVyQ2FzZSgpKVxyXG4gICAgICAgICAgICAmJiBhbkFjY291bnQuaWRUb2tlbkNsYWltcy5hdWQgPT09IGdsb2JhbEFwcFNldHRpbmdzLm1zYWxDb25maWcuYXV0aC5jbGllbnRJZFxyXG4gICAgICAgICl7XHJcbiAgICAgICAgICAgIGZvdW5kQWNjb3VudD0gYW5BY2NvdW50O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuc2V0QWNjb3VudChmb3VuZEFjY291bnQpXHJcbiAgICByZXR1cm4gZm91bmRBY2NvdW50O1xyXG59XHJcblxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuY2FsbEF6dXJlRnVuY3Rpb25zU2VydmljZT1hc3luYyBmdW5jdGlvbihBUElTdHJpbmcsUkVTVE1ldGhvZCxwYXlsb2FkKXtcclxuICAgIHZhciBoZWFkZXJzT2JqPXt9XHJcbiAgICB2YXIgdG9rZW49YXdhaXQgdGhpcy5nZXRUb2tlbihnbG9iYWxBcHBTZXR0aW5ncy5iMmNTY29wZV9mdW5jdGlvbnMpXHJcbiAgICBoZWFkZXJzT2JqW1wiQXV0aG9yaXphdGlvblwiXT1gQmVhcmVyICR7dG9rZW59YFxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB2YXIgYWpheENvbnRlbnQ9e1xyXG4gICAgICAgICAgICB0eXBlOiBSRVNUTWV0aG9kIHx8ICdHRVQnLFxyXG4gICAgICAgICAgICBcImhlYWRlcnNcIjpoZWFkZXJzT2JqLFxyXG4gICAgICAgICAgICB1cmw6IGdsb2JhbEFwcFNldHRpbmdzLmZ1bmN0aW9uc0FQSVVSSStBUElTdHJpbmcsXHJcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcclxuICAgICAgICAgICAgY3Jvc3NEb21haW46IHRydWUsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwb25zZURhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlRGF0YSlcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZURhdGEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QocmVzcG9uc2VEYXRhKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKFJFU1RNZXRob2Q9PVwiUE9TVFwiKSBhamF4Q29udGVudC5kYXRhPSBKU09OLnN0cmluZ2lmeShwYXlsb2FkKVxyXG4gICAgICAgICQuYWpheChhamF4Q29udGVudCk7XHJcbiAgICB9KVxyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5jYWxsQVBJPWFzeW5jIGZ1bmN0aW9uKEFQSVN0cmluZyxSRVNUTWV0aG9kLHBheWxvYWQpe1xyXG4gICAgdmFyIGhlYWRlcnNPYmo9e31cclxuICAgIGlmKCFnbG9iYWxBcHBTZXR0aW5ncy5pc0xvY2FsVGVzdCl7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgdG9rZW49YXdhaXQgdGhpcy5nZXRUb2tlbihnbG9iYWxBcHBTZXR0aW5ncy5iMmNTY29wZV90YXNrbWFzdGVyKVxyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgd2luZG93Lm9wZW4oZ2xvYmFsQXBwU2V0dGluZ3MubG9nb3V0UmVkaXJlY3RVcmksXCJfc2VsZlwiKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBoZWFkZXJzT2JqW1wiQXV0aG9yaXphdGlvblwiXT1gQmVhcmVyICR7dG9rZW59YFxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdmFyIGFqYXhDb250ZW50PXtcclxuICAgICAgICAgICAgdHlwZTogUkVTVE1ldGhvZCB8fCAnR0VUJyxcclxuICAgICAgICAgICAgXCJoZWFkZXJzXCI6aGVhZGVyc09iaixcclxuICAgICAgICAgICAgdXJsOiBnbG9iYWxBcHBTZXR0aW5ncy50YXNrTWFzdGVyQVBJVVJJK0FQSVN0cmluZyxcclxuICAgICAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxyXG4gICAgICAgICAgICBjcm9zc0RvbWFpbjogdHJ1ZSxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3BvbnNlRGF0YSwgdGV4dFN0YXR1cywganFYSFIpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUocmVzcG9uc2VEYXRhKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlRGF0YSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcclxuICAgICAgICAgICAgICAgIHJlamVjdChyZXNwb25zZURhdGEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoUkVTVE1ldGhvZD09XCJQT1NUXCIpIGFqYXhDb250ZW50LmRhdGE9IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpXHJcbiAgICAgICAgJC5hamF4KGFqYXhDb250ZW50KTtcclxuICAgIH0pXHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLmdldFRva2VuPWFzeW5jIGZ1bmN0aW9uKGIyY1Njb3BlKXtcclxuICAgIHRyeXtcclxuICAgICAgICBpZih0aGlzLnN0b3JlZFRva2VuPT1udWxsKSB0aGlzLnN0b3JlZFRva2VuPXt9XHJcbiAgICAgICAgaWYodGhpcy5zdG9yZWRUb2tlbltiMmNTY29wZV0hPW51bGwpe1xyXG4gICAgICAgICAgICB2YXIgY3VyclRpbWU9cGFyc2VJbnQobmV3IERhdGUoKS5nZXRUaW1lKCkvMTAwMClcclxuICAgICAgICAgICAgaWYoY3VyclRpbWUrNjAgPCB0aGlzLnN0b3JlZFRva2VuW2IyY1Njb3BlXS5leHBpcmUpIHJldHVybiB0aGlzLnN0b3JlZFRva2VuW2IyY1Njb3BlXS5hY2Nlc3NUb2tlblxyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdG9rZW5SZXF1ZXN0PXtcclxuICAgICAgICAgICAgc2NvcGVzOiBbYjJjU2NvcGVdLFxyXG4gICAgICAgICAgICBmb3JjZVJlZnJlc2g6IGZhbHNlLCAvLyBTZXQgdGhpcyB0byBcInRydWVcIiB0byBza2lwIGEgY2FjaGVkIHRva2VuIGFuZCBnbyB0byB0aGUgc2VydmVyIHRvIGdldCBhIG5ldyB0b2tlblxyXG4gICAgICAgICAgICBhY2NvdW50OiB0aGlzLm15TVNBTE9iai5nZXRBY2NvdW50QnlIb21lSWQodGhpcy5hY2NvdW50SWQpXHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgdmFyIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5teU1TQUxPYmouYWNxdWlyZVRva2VuU2lsZW50KHRva2VuUmVxdWVzdClcclxuICAgICAgICBpZiAoIXJlc3BvbnNlLmFjY2Vzc1Rva2VuIHx8IHJlc3BvbnNlLmFjY2Vzc1Rva2VuID09PSBcIlwiKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBtc2FsLkludGVyYWN0aW9uUmVxdWlyZWRBdXRoRXJyb3I7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc3RvcmVkVG9rZW5bYjJjU2NvcGVdPXtcImFjY2Vzc1Rva2VuXCI6cmVzcG9uc2UuYWNjZXNzVG9rZW4sXCJleHBpcmVcIjpyZXNwb25zZS5pZFRva2VuQ2xhaW1zLmV4cH1cclxuICAgIH1jYXRjaChlcnJvcil7XHJcbiAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgbXNhbC5JbnRlcmFjdGlvblJlcXVpcmVkQXV0aEVycm9yKSB7XHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrIHRvIGludGVyYWN0aW9uIHdoZW4gc2lsZW50IGNhbGwgZmFpbHNcclxuICAgICAgICAgICAgdmFyIHJlc3BvbnNlPWF3YWl0IHRoaXMubXlNU0FMT2JqLmFjcXVpcmVUb2tlblBvcHVwKHRva2VuUmVxdWVzdClcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmFjY2Vzc1Rva2VuO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBtc2FsSGVscGVyKCk7Il19
