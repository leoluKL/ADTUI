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
    "taskMasterAPIURI":((isLocalTest)?"http://localhost:5002/":"https://azureiotrockstaskmastermodule.azurewebsites.net/")
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2dsb2JhbEFwcFNldHRpbmdzLmpzIiwiLi4vc3BhU291cmNlQ29kZS9tYWluVUkuanMiLCIuLi9zcGFTb3VyY2VDb2RlL21zYWxIZWxwZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImNvbnN0IHNpZ251cHNpZ25pbm5hbWU9XCJCMkNfMV9zaW5ndXBzaWduaW5fc3BhYXBwMVwiXHJcbmNvbnN0IGIyY1RlbmFudE5hbWU9XCJhenVyZWlvdGIyY1wiXHJcblxyXG5jb25zdCB1cmwgPSBuZXcgVVJMKHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcclxuXHJcbnZhciBzdHJBcnI9d2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoXCI/XCIpXHJcbnZhciBpc0xvY2FsVGVzdD0oc3RyQXJyLmluZGV4T2YoXCJ0ZXN0PTFcIikhPS0xKVxyXG5cclxuY29uc3QgZ2xvYmFsQXBwU2V0dGluZ3M9e1xyXG4gICAgXCJiMmNTaWduVXBTaWduSW5OYW1lXCI6IHNpZ251cHNpZ25pbm5hbWUsXHJcbiAgICBcImIyY1Njb3BlX3Rhc2ttYXN0ZXJcIjpcImh0dHBzOi8vXCIrYjJjVGVuYW50TmFtZStcIi5vbm1pY3Jvc29mdC5jb20vdGFza21hc3Rlcm1vZHVsZS9vcGVyYXRpb25cIixcclxuICAgIFwiYjJjU2NvcGVfZnVuY3Rpb25zXCI6XCJodHRwczovL1wiK2IyY1RlbmFudE5hbWUrXCIub25taWNyb3NvZnQuY29tL2F6dXJlaW90cm9ja3NmdW5jdGlvbnMvYmFzaWNcIixcclxuICAgIFwibG9nb3V0UmVkaXJlY3RVcmlcIjogdXJsLm9yaWdpbitcIi9zcGFpbmRleC5odG1sXCIsXHJcbiAgICBcIm1zYWxDb25maWdcIjp7XHJcbiAgICAgICAgYXV0aDoge1xyXG4gICAgICAgICAgICBjbGllbnRJZDogXCJmNDY5M2JlNS02MDFiLTRkMGUtOTIwOC1jMzVkOWFkNjIzODdcIixcclxuICAgICAgICAgICAgYXV0aG9yaXR5OiBcImh0dHBzOi8vXCIrYjJjVGVuYW50TmFtZStcIi5iMmNsb2dpbi5jb20vXCIrYjJjVGVuYW50TmFtZStcIi5vbm1pY3Jvc29mdC5jb20vXCIrc2lnbnVwc2lnbmlubmFtZSxcclxuICAgICAgICAgICAga25vd25BdXRob3JpdGllczogW2IyY1RlbmFudE5hbWUrXCIuYjJjbG9naW4uY29tXCJdLFxyXG4gICAgICAgICAgICByZWRpcmVjdFVyaTogd2luZG93LmxvY2F0aW9uLmhyZWZcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNhY2hlOiB7XHJcbiAgICAgICAgICAgIGNhY2hlTG9jYXRpb246IFwic2Vzc2lvblN0b3JhZ2VcIiwgXHJcbiAgICAgICAgICAgIHN0b3JlQXV0aFN0YXRlSW5Db29raWU6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzeXN0ZW06IHtcclxuICAgICAgICAgICAgbG9nZ2VyT3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgbG9nZ2VyQ2FsbGJhY2s6IChsZXZlbCwgbWVzc2FnZSwgY29udGFpbnNQaWkpID0+IHt9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXCJpc0xvY2FsVGVzdFwiOmlzTG9jYWxUZXN0LFxyXG4gICAgXCJ0YXNrTWFzdGVyQVBJVVJJXCI6KChpc0xvY2FsVGVzdCk/XCJodHRwOi8vbG9jYWxob3N0OjUwMDIvXCI6XCJodHRwczovL2F6dXJlaW90cm9ja3N0YXNrbWFzdGVybW9kdWxlLmF6dXJld2Vic2l0ZXMubmV0L1wiKVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGdsb2JhbEFwcFNldHRpbmdzOyIsIi8vdGhlIFN0YXJ0IHBhZ2UgaXMgdGhlIHNpZ24gaW4gcGFnZVxyXG5jb25zdCBnbG9iYWxBcHBTZXR0aW5ncz1yZXF1aXJlKFwiLi9nbG9iYWxBcHBTZXR0aW5nc1wiKVxyXG5jb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuL21zYWxIZWxwZXJcIilcclxuXHJcbmZ1bmN0aW9uIG1haW5VSSgpIHtcclxuICAgIHRoaXMubXlNU0FMT2JqID0gbmV3IG1zYWwuUHVibGljQ2xpZW50QXBwbGljYXRpb24oZ2xvYmFsQXBwU2V0dGluZ3MubXNhbENvbmZpZyk7XHJcbiAgICAkKCcjc2lnbkluQnRuJykub24oXCJjbGlja1wiLGFzeW5jICgpPT57XHJcbiAgICAgICAgdmFyIHRoZUFjY291bnQ9YXdhaXQgbXNhbEhlbHBlci5zaWduSW4oKVxyXG4gICAgICAgIGlmKHRoZUFjY291bnQhPW51bGwpIHRoaXMuYWZ0ZXJTaWduZWRJbih0aGVBY2NvdW50KTtcclxuICAgIH0pXHJcbiAgICAvL2luIGNhc2Ugb2YgcGFnZSByZWZyZXNoIGFuZCBpdCBtaWdodCBiZSBvayB0byBmZXRjaCBhY2NvdW50IGRpcmVjdGx5IGZyb20gY2FjaGVcclxuICAgIHZhciB0aGVBY2NvdW50PW1zYWxIZWxwZXIuZmV0Y2hBY2NvdW50KCk7IFxyXG5cclxuICAgIGlmKHRoZUFjY291bnQhPW51bGwpIHRoaXMuYWZ0ZXJTaWduZWRJbih0aGVBY2NvdW50LFwibm9BbmltYXRpb25cIilcclxufVxyXG5cclxubWFpblVJLnByb3RvdHlwZS5hZnRlclNpZ25lZEluPWFzeW5jIGZ1bmN0aW9uKGFuQWNjb3VudCxub0FuaW1hdGlvbil7XHJcbiAgICBpZihub0FuaW1hdGlvbil7XHJcbiAgICAgICAgJCgnI2hlYWRlclBhcnQnKS5jc3Moe2hlaWdodDpcIjEwMHZoXCIsXCJwYWRkaW5nXCI6XCIxNXB4XCJ9KVxyXG4gICAgICAgIHRoaXMuc2hvd01vZHVsZUJ1dHRvbnMoKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgJCgnI2hlYWRlclBhcnQnKS5hbmltYXRlKHtoZWlnaHQ6XCIxMDB2aFwifSlcclxuICAgICAgICAkKCcjZ2l0aHVibGluaycpLmFuaW1hdGUoe29wYWNpdHk6XCIwXCJ9KVxyXG4gICAgICAgICQoJyNzaWduSW5CdG4nKS5hbmltYXRlKHtvcGFjaXR5OlwiMFwifSlcclxuICAgICAgICAkKCcjZm9vdGVyUGFydCcpLmFuaW1hdGUoe29wYWNpdHk6XCIwXCJ9LCgpPT57dGhpcy5zaG93TW9kdWxlQnV0dG9ucygpfSlcclxuICAgICAgICAkKCcjaGVhZGVyUGFydCcpLmFuaW1hdGUoe1wicGFkZGluZ1wiOlwiMTVweFwifSlcclxuICAgIH1cclxuXHJcbiAgICAvL2Fsc28gbm90aWZ5IHRhc2ttYXN0ZXIgdG8gY2hlY2sgdXNlciBpbmZvIGluIGNvc21vc0RCLCBpbmNhc2UgaXQgaXMgbmV3IHVzZXIsIGNyZWF0ZSB0aGUgdXNlciBpbiBjb3Ntb3NEQlxyXG4gICAgbXNhbEhlbHBlci5jYWxsQVBJKFwiYWNjb3VudE1hbmFnZW1lbnQvZmV0Y2hVc2VyQWNjb3VudFwiKVxyXG59XHJcblxyXG5tYWluVUkucHJvdG90eXBlLnNob3dNb2R1bGVCdXR0b25zPWZ1bmN0aW9uKCl7XHJcbiAgICAkKCcjZ2l0aHVibGluaycpLnJlbW92ZSgpXHJcbiAgICAkKCcjc2lnbkluQnRuJykucmVtb3ZlKClcclxuICAgICQoJyNkZXNjcmlwdGlvblBhcnQnKS5yZW1vdmUoKVxyXG4gICAgJCgnI2Zvb3RlclBhcnQnKS5yZW1vdmUoKVxyXG5cclxuICAgIC8vJCgnI2hlYWRlclBhcnQnKS5lbXB0eSgpXHJcbiAgICB2YXIgZGV2aWNlTWFuYWdlQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtaG92ZXItYW1iZXIgdzMtcmlwcGxlIHczLWNhcmQgdzMtcGFkZGluZy0xNiB3My1tYXJnaW4tYm90dG9tXCIgc3R5bGU9XCJ3aWR0aDo1NTBweDtkaXNwbGF5OmJsb2NrXCI+RGV2aWNlIE1hbmFnZW1lbnQ8L2J1dHRvbj4nKVxyXG4gICAgdmFyIGFkdFVJQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtaG92ZXItYW1iZXIgdzMtcmlwcGxlIHczLWNhcmQgdzMtcGFkZGluZy0xNiB3My1tYXJnaW4tYm90dG9tXCIgc3R5bGU9XCJ3aWR0aDo1NTBweDtkaXNwbGF5OmJsb2NrXCI+RGlnaXRhbCBUd2luPC9idXR0b24+JylcclxuICAgIHZhciBldmVudExvZ0J0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyIHczLXJpcHBsZSB3My1jYXJkIHczLXBhZGRpbmctMTYgdzMtbWFyZ2luLWJvdHRvbVwiIHN0eWxlPVwid2lkdGg6NTUwcHg7ZGlzcGxheTpibG9ja1wiPkV2ZW50IExvZzwvYnV0dG9uPicpXHJcbiAgICB2YXIgbG9nb3V0QnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYmxhY2sgdzMtcmlwcGxlIHczLWNhcmQgdzMtcGFkZGluZy0xNiB3My1tYXJnaW4tYm90dG9tXCIgc3R5bGU9XCJ3aWR0aDozNTBweDtkaXNwbGF5OmJsb2NrO21hcmdpbi1sZWZ0OjEwMHB4O21hcmdpbi10b3A6MzJweFwiPlNpZ24gT3V0PC9idXR0b24+JylcclxuICAgIFxyXG4gICAgJCgnI2hlYWRlclBhcnQnKS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cIndpZHRoOjUwJVwiIGNsYXNzPVwidzMtY29udGFpbmVyICB3My1jZWxsIFwiPjwvZGl2PjxkaXYgaWQ9XCJtaWRkbGVESVZcIiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1jZWxsIHczLWNlbGwtbWlkZGxlXCIgc3R5bGU9XCJoZWlnaHQ6NTB2aFwiPjwvZGl2PjxkaXYgc3R5bGU9XCJ3aWR0aDo1MCVcIiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1jZWxsXCI+JykpXHJcbiAgICAkKCcjbWlkZGxlRElWJykuYXBwZW5kKGRldmljZU1hbmFnZUJ0bixhZHRVSUJ0bixldmVudExvZ0J0bixsb2dvdXRCdG4pIFxyXG5cclxuICAgIGxvZ291dEJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICAvL1RPRE86IGlmIGxvZ291dCBmcm9tIHRoZSBtb2R1bGVzIHBhZ2UsIHNob3VsZCByZWRpcmVjdCB0byB0aGUgc3BhaW5kZXguaHRtbCBwYWdlXHJcbiAgICAgICAgY29uc3QgbG9nb3V0UmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgcG9zdExvZ291dFJlZGlyZWN0VXJpOiBnbG9iYWxBcHBTZXR0aW5ncy5sb2dvdXRSZWRpcmVjdFVyaSxcclxuICAgICAgICAgICAgbWFpbldpbmRvd1JlZGlyZWN0VXJpOiBnbG9iYWxBcHBTZXR0aW5ncy5sb2dvdXRSZWRpcmVjdFVyaVxyXG4gICAgICAgIH07XHJcbiAgICBcclxuICAgICAgICB0aGlzLm15TVNBTE9iai5sb2dvdXRQb3B1cChsb2dvdXRSZXF1ZXN0KTtcclxuICAgIH0pXHJcblxyXG4gICAgYWR0VUlCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgd2luZG93Lm9wZW4oXCJkaWdpdGFsdHdpbm1vZHVsZS5odG1sXCIsIFwiX2JsYW5rXCIpO1xyXG4gICAgfSlcclxuXHJcbiAgICAvL2lmIHRoaXMgcGFnZSBpcyBvcGVuIGluIGxvY2FsaG9zdCBlbnZpcm9ubWVudCwgYWRkIHRocmVlIGJ1dHRvbnMgdG8gYWxsb3cgcGFnZXMgb3BlbmluZyBhbmQgdXNpbmcgbG9jYWwgcnVubmluZyBhcGkgYXBwIGluc3RlYWRcclxuICAgIC8vIG9mIGNsb3VkIGFwaSBhcHAgaW4gYXp1cmUgYXBwIHNlcnZpY2UuIEluIHByb2R1Y3Rpb24gZW52aXJvbm1lbnQsIHRoZXNlIGJ1dHRvbnMgd2lsbCBuZXZlciBzaG93XHJcbiAgICBpZih3aW5kb3cubG9jYXRpb24uaHJlZi5zdGFydHNXaXRoKFwiaHR0cDovL2xvY2FsaG9zdFwiKSl7XHJcbiAgICAgICAgdmFyIGRldmljZU1hbmFnZUxvY2FsQVBJQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtZGFyay1ncmV5IHczLWNhcmQgdzMtcGFkZGluZy0xNiB3My1tYXJnaW4tYm90dG9tXCIgPkRldmljZSBNYW5hZ2VtZW50KExvY2FsIEFQSSk8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBhZHRVSUxvY2FsQVBJQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtZGFyay1ncmV5IHczLWNhcmQgdzMtcGFkZGluZy0xNiB3My1tYXJnaW4tYm90dG9tXCI+RGlnaXRhbCBUd2luKExvY2FsIEFQSSk8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBldmVudExvZ0xvY2FsQVBJQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtZGFyay1ncmV5IHczLWNhcmQgdzMtcGFkZGluZy0xNiB3My1tYXJnaW4tYm90dG9tXCI+RXZlbnQgTG9nKExvY2FsIEFQSSk8L2J1dHRvbj4nKVxyXG4gICAgICAgICQoJyNtaWRkbGVESVYnKS5hcHBlbmQoZGV2aWNlTWFuYWdlTG9jYWxBUElCdG4sYWR0VUlMb2NhbEFQSUJ0bixldmVudExvZ0xvY2FsQVBJQnRuKSBcclxuXHJcbiAgICAgICAgYWR0VUlMb2NhbEFQSUJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICAgICAgd2luZG93Lm9wZW4oXCJkaWdpdGFsdHdpbm1vZHVsZS5odG1sP3Rlc3Q9MVwiLCBcIl9ibGFua1wiKTtcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1haW5VSSgpOyIsImNvbnN0IGdsb2JhbEFwcFNldHRpbmdzPXJlcXVpcmUoXCIuL2dsb2JhbEFwcFNldHRpbmdzXCIpXHJcblxyXG5mdW5jdGlvbiBtc2FsSGVscGVyKCl7XHJcbiAgICB0aGlzLm15TVNBTE9iaiA9IG5ldyBtc2FsLlB1YmxpY0NsaWVudEFwcGxpY2F0aW9uKGdsb2JhbEFwcFNldHRpbmdzLm1zYWxDb25maWcpO1xyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5zaWduSW49YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgcmVzcG9uc2U9IGF3YWl0IHRoaXMubXlNU0FMT2JqLmxvZ2luUG9wdXAoeyBzY29wZXM6W10gIH0pIC8vZ2xvYmFsQXBwU2V0dGluZ3MuYjJjU2NvcGVzXHJcbiAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpXHJcbiAgICAgICAgaWYgKHJlc3BvbnNlICE9IG51bGwpe1xyXG4gICAgICAgICAgICB0aGlzLnNldEFjY291bnQocmVzcG9uc2UuYWNjb3VudClcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmFjY291bnRcclxuICAgICAgICB9IFxyXG4gICAgICAgIGVsc2UgIHJldHVybiB0aGlzLmZldGNoQWNjb3VudCgpXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgaWYoZS5lcnJvckNvZGUhPVwidXNlcl9jYW5jZWxsZWRcIikgY29uc29sZS5sb2coZSlcclxuICAgIH1cclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuc2V0QWNjb3VudD1mdW5jdGlvbih0aGVBY2NvdW50KXtcclxuICAgIGlmKHRoZUFjY291bnQ9PW51bGwpcmV0dXJuO1xyXG4gICAgdGhpcy5hY2NvdW50SWQgPSB0aGVBY2NvdW50LmhvbWVBY2NvdW50SWQ7XHJcbiAgICB0aGlzLmFjY291bnROYW1lID0gdGhlQWNjb3VudC51c2VybmFtZTtcclxuICAgIHRoaXMudXNlck5hbWU9dGhlQWNjb3VudC5uYW1lO1xyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5mZXRjaEFjY291bnQ9ZnVuY3Rpb24obm9BbmltYXRpb24pe1xyXG4gICAgY29uc3QgY3VycmVudEFjY291bnRzID0gdGhpcy5teU1TQUxPYmouZ2V0QWxsQWNjb3VudHMoKTtcclxuICAgIGlmIChjdXJyZW50QWNjb3VudHMubGVuZ3RoIDwgMSkgcmV0dXJuO1xyXG4gICAgdmFyIGZvdW5kQWNjb3VudD1udWxsO1xyXG4gICAgZm9yKHZhciBpPTA7aTxjdXJyZW50QWNjb3VudHMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGFuQWNjb3VudD0gY3VycmVudEFjY291bnRzW2ldXHJcbiAgICAgICAgaWYoYW5BY2NvdW50LmhvbWVBY2NvdW50SWQudG9VcHBlckNhc2UoKS5pbmNsdWRlcyhnbG9iYWxBcHBTZXR0aW5ncy5iMmNTaWduVXBTaWduSW5OYW1lLnRvVXBwZXJDYXNlKCkpXHJcbiAgICAgICAgICAgICYmIGFuQWNjb3VudC5pZFRva2VuQ2xhaW1zLmlzcy50b1VwcGVyQ2FzZSgpLmluY2x1ZGVzKGdsb2JhbEFwcFNldHRpbmdzLm1zYWxDb25maWcuYXV0aC5rbm93bkF1dGhvcml0aWVzWzBdLnRvVXBwZXJDYXNlKCkpXHJcbiAgICAgICAgICAgICYmIGFuQWNjb3VudC5pZFRva2VuQ2xhaW1zLmF1ZCA9PT0gZ2xvYmFsQXBwU2V0dGluZ3MubXNhbENvbmZpZy5hdXRoLmNsaWVudElkXHJcbiAgICAgICAgKXtcclxuICAgICAgICAgICAgZm91bmRBY2NvdW50PSBhbkFjY291bnQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5zZXRBY2NvdW50KGZvdW5kQWNjb3VudClcclxuICAgIHJldHVybiBmb3VuZEFjY291bnQ7XHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLmNhbGxBUEk9YXN5bmMgZnVuY3Rpb24oQVBJU3RyaW5nLFJFU1RNZXRob2QscGF5bG9hZCl7XHJcbiAgICB2YXIgaGVhZGVyc09iaj17fVxyXG4gICAgaWYoIWdsb2JhbEFwcFNldHRpbmdzLmlzTG9jYWxUZXN0KXtcclxuICAgICAgICB2YXIgdG9rZW49YXdhaXQgdGhpcy5nZXRUb2tlbihnbG9iYWxBcHBTZXR0aW5ncy5iMmNTY29wZV90YXNrbWFzdGVyKVxyXG4gICAgICAgIGhlYWRlcnNPYmpbXCJBdXRob3JpemF0aW9uXCJdPWBCZWFyZXIgJHt0b2tlbn1gXHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHZhciBhamF4Q29udGVudD17XHJcbiAgICAgICAgICAgIHR5cGU6IFJFU1RNZXRob2QgfHwgJ0dFVCcsXHJcbiAgICAgICAgICAgIFwiaGVhZGVyc1wiOmhlYWRlcnNPYmosXHJcbiAgICAgICAgICAgIHVybDogZ2xvYmFsQXBwU2V0dGluZ3MudGFza01hc3RlckFQSVVSSStBUElTdHJpbmcsXHJcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcclxuICAgICAgICAgICAgY3Jvc3NEb21haW46IHRydWUsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwb25zZURhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlRGF0YSlcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZURhdGEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QocmVzcG9uc2VEYXRhKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKFJFU1RNZXRob2Q9PVwiUE9TVFwiKSBhamF4Q29udGVudC5kYXRhPSBKU09OLnN0cmluZ2lmeShwYXlsb2FkKVxyXG4gICAgICAgICQuYWpheChhamF4Q29udGVudCk7XHJcbiAgICB9KVxyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5nZXRUb2tlbj1hc3luYyBmdW5jdGlvbihiMmNTY29wZSl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgaWYodGhpcy5zdG9yZWRUb2tlbj09bnVsbCkgdGhpcy5zdG9yZWRUb2tlbj17fVxyXG4gICAgICAgIGlmKHRoaXMuc3RvcmVkVG9rZW5bYjJjU2NvcGVdIT1udWxsKXtcclxuICAgICAgICAgICAgdmFyIGN1cnJUaW1lPXBhcnNlSW50KG5ldyBEYXRlKCkuZ2V0VGltZSgpLzEwMDApXHJcbiAgICAgICAgICAgIGlmKGN1cnJUaW1lKzYwIDwgdGhpcy5zdG9yZWRUb2tlbltiMmNTY29wZV0uZXhwaXJlKSByZXR1cm4gdGhpcy5zdG9yZWRUb2tlbltiMmNTY29wZV0uYWNjZXNzVG9rZW5cclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHRva2VuUmVxdWVzdD17XHJcbiAgICAgICAgICAgIHNjb3BlczogW2IyY1Njb3BlXSxcclxuICAgICAgICAgICAgZm9yY2VSZWZyZXNoOiBmYWxzZSwgLy8gU2V0IHRoaXMgdG8gXCJ0cnVlXCIgdG8gc2tpcCBhIGNhY2hlZCB0b2tlbiBhbmQgZ28gdG8gdGhlIHNlcnZlciB0byBnZXQgYSBuZXcgdG9rZW5cclxuICAgICAgICAgICAgYWNjb3VudDogdGhpcy5teU1TQUxPYmouZ2V0QWNjb3VudEJ5SG9tZUlkKHRoaXMuYWNjb3VudElkKVxyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIHZhciByZXNwb25zZSA9IGF3YWl0IHRoaXMubXlNU0FMT2JqLmFjcXVpcmVUb2tlblNpbGVudCh0b2tlblJlcXVlc3QpXHJcbiAgICAgICAgaWYgKCFyZXNwb25zZS5hY2Nlc3NUb2tlbiB8fCByZXNwb25zZS5hY2Nlc3NUb2tlbiA9PT0gXCJcIikge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgbXNhbC5JbnRlcmFjdGlvblJlcXVpcmVkQXV0aEVycm9yO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnN0b3JlZFRva2VuW2IyY1Njb3BlXT17XCJhY2Nlc3NUb2tlblwiOnJlc3BvbnNlLmFjY2Vzc1Rva2VuLFwiZXhwaXJlXCI6cmVzcG9uc2UuaWRUb2tlbkNsYWltcy5leHB9XHJcbiAgICB9Y2F0Y2goZXJyb3Ipe1xyXG4gICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIG1zYWwuSW50ZXJhY3Rpb25SZXF1aXJlZEF1dGhFcnJvcikge1xyXG4gICAgICAgICAgICAvLyBmYWxsYmFjayB0byBpbnRlcmFjdGlvbiB3aGVuIHNpbGVudCBjYWxsIGZhaWxzXHJcbiAgICAgICAgICAgIHZhciByZXNwb25zZT1hd2FpdCB0aGlzLm15TVNBTE9iai5hY3F1aXJlVG9rZW5Qb3B1cCh0b2tlblJlcXVlc3QpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXNwb25zZS5hY2Nlc3NUb2tlbjtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbXNhbEhlbHBlcigpOyJdfQ==
