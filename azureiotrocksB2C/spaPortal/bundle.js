(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const signupsigninname="B2C_1_singupsignin_spaapp1"
const b2cTenantName="azureiotb2c"

const url = new URL(window.location.href);

var strArr=window.location.href.split("?")
var isLocalTest=(strArr.indexOf("test=1")!=-1)

const globalAppSettings={
    "b2cSignUpSignInName": signupsigninname,
    "b2cScopes":["https://"+b2cTenantName+".onmicrosoft.com/taskmastermodule/operation"],
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
    "taskMasterAPIURI":((isLocalTest)?"http://localhost:5000/":"https://azureiotrockstaskmastermodule.azurewebsites.net/")
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

mainUI.prototype.afterSignedIn=function(anAccount,noAnimation){
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
        var response= await this.myMSALObj.loginPopup({ scopes: globalAppSettings.b2cScopes })
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
    this.username = theAccount.username;
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
        var token=await this.getToken()
        headersObj["Authorization"]=`Bearer ${token}`
    } 
    return new Promise((resolve, reject) => {
        $.ajax({
            type: RESTMethod || 'GET',
            "headers":headersObj,
            url: globalAppSettings.taskMasterAPIURI+APIString,
            crossDomain: true,
            success: function (responseData, textStatus, jqXHR) {
                resolve(responseData)
            },
            error: function (responseData, textStatus, errorThrown) {
                reject(responseData)
            }
        });
    })
}

msalHelper.prototype.getToken=async function(){
    try{
        if(this.storedToken!=null){
            var currTime=parseInt(new Date().getTime()/1000)
            if(currTime+600 < this.storedTokenExp) return this.storedToken
        }
        var tokenRequest={
            scopes: globalAppSettings.b2cScopes,
            forceRefresh: false, // Set this to "true" to skip a cached token and go to the server to get a new token
            account: this.myMSALObj.getAccountByHomeId(this.accountId)
        }
    
        var response = await this.myMSALObj.acquireTokenSilent(tokenRequest)
        if (!response.accessToken || response.accessToken === "") {
            throw new msal.InteractionRequiredAuthError;
        }

        this.storedToken=response.accessToken
        this.storedTokenExp=response.idTokenClaims.exp
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2dsb2JhbEFwcFNldHRpbmdzLmpzIiwiLi4vc3BhU291cmNlQ29kZS9tYWluVUkuanMiLCIuLi9zcGFTb3VyY2VDb2RlL21zYWxIZWxwZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJjb25zdCBzaWdudXBzaWduaW5uYW1lPVwiQjJDXzFfc2luZ3Vwc2lnbmluX3NwYWFwcDFcIlxyXG5jb25zdCBiMmNUZW5hbnROYW1lPVwiYXp1cmVpb3RiMmNcIlxyXG5cclxuY29uc3QgdXJsID0gbmV3IFVSTCh3aW5kb3cubG9jYXRpb24uaHJlZik7XHJcblxyXG52YXIgc3RyQXJyPXdpbmRvdy5sb2NhdGlvbi5ocmVmLnNwbGl0KFwiP1wiKVxyXG52YXIgaXNMb2NhbFRlc3Q9KHN0ckFyci5pbmRleE9mKFwidGVzdD0xXCIpIT0tMSlcclxuXHJcbmNvbnN0IGdsb2JhbEFwcFNldHRpbmdzPXtcclxuICAgIFwiYjJjU2lnblVwU2lnbkluTmFtZVwiOiBzaWdudXBzaWduaW5uYW1lLFxyXG4gICAgXCJiMmNTY29wZXNcIjpbXCJodHRwczovL1wiK2IyY1RlbmFudE5hbWUrXCIub25taWNyb3NvZnQuY29tL3Rhc2ttYXN0ZXJtb2R1bGUvb3BlcmF0aW9uXCJdLFxyXG4gICAgXCJsb2dvdXRSZWRpcmVjdFVyaVwiOiB1cmwub3JpZ2luK1wiL3NwYWluZGV4Lmh0bWxcIixcclxuICAgIFwibXNhbENvbmZpZ1wiOntcclxuICAgICAgICBhdXRoOiB7XHJcbiAgICAgICAgICAgIGNsaWVudElkOiBcImY0NjkzYmU1LTYwMWItNGQwZS05MjA4LWMzNWQ5YWQ2MjM4N1wiLFxyXG4gICAgICAgICAgICBhdXRob3JpdHk6IFwiaHR0cHM6Ly9cIitiMmNUZW5hbnROYW1lK1wiLmIyY2xvZ2luLmNvbS9cIitiMmNUZW5hbnROYW1lK1wiLm9ubWljcm9zb2Z0LmNvbS9cIitzaWdudXBzaWduaW5uYW1lLFxyXG4gICAgICAgICAgICBrbm93bkF1dGhvcml0aWVzOiBbYjJjVGVuYW50TmFtZStcIi5iMmNsb2dpbi5jb21cIl0sXHJcbiAgICAgICAgICAgIHJlZGlyZWN0VXJpOiB3aW5kb3cubG9jYXRpb24uaHJlZlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY2FjaGU6IHtcclxuICAgICAgICAgICAgY2FjaGVMb2NhdGlvbjogXCJzZXNzaW9uU3RvcmFnZVwiLCBcclxuICAgICAgICAgICAgc3RvcmVBdXRoU3RhdGVJbkNvb2tpZTogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIHN5c3RlbToge1xyXG4gICAgICAgICAgICBsb2dnZXJPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBsb2dnZXJDYWxsYmFjazogKGxldmVsLCBtZXNzYWdlLCBjb250YWluc1BpaSkgPT4ge31cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcImlzTG9jYWxUZXN0XCI6aXNMb2NhbFRlc3QsXHJcbiAgICBcInRhc2tNYXN0ZXJBUElVUklcIjooKGlzTG9jYWxUZXN0KT9cImh0dHA6Ly9sb2NhbGhvc3Q6NTAwMC9cIjpcImh0dHBzOi8vYXp1cmVpb3Ryb2Nrc3Rhc2ttYXN0ZXJtb2R1bGUuYXp1cmV3ZWJzaXRlcy5uZXQvXCIpXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZ2xvYmFsQXBwU2V0dGluZ3M7IiwiLy90aGUgU3RhcnQgcGFnZSBpcyB0aGUgc2lnbiBpbiBwYWdlXHJcbmNvbnN0IGdsb2JhbEFwcFNldHRpbmdzPXJlcXVpcmUoXCIuL2dsb2JhbEFwcFNldHRpbmdzXCIpXHJcbmNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4vbXNhbEhlbHBlclwiKVxyXG5cclxuZnVuY3Rpb24gbWFpblVJKCkge1xyXG4gICAgdGhpcy5teU1TQUxPYmogPSBuZXcgbXNhbC5QdWJsaWNDbGllbnRBcHBsaWNhdGlvbihnbG9iYWxBcHBTZXR0aW5ncy5tc2FsQ29uZmlnKTtcclxuICAgICQoJyNzaWduSW5CdG4nKS5vbihcImNsaWNrXCIsYXN5bmMgKCk9PntcclxuICAgICAgICB2YXIgdGhlQWNjb3VudD1hd2FpdCBtc2FsSGVscGVyLnNpZ25JbigpXHJcbiAgICAgICAgaWYodGhlQWNjb3VudCE9bnVsbCkgdGhpcy5hZnRlclNpZ25lZEluKHRoZUFjY291bnQpO1xyXG4gICAgfSlcclxuICAgIC8vaW4gY2FzZSBvZiBwYWdlIHJlZnJlc2ggYW5kIGl0IG1pZ2h0IGJlIG9rIHRvIGZldGNoIGFjY291bnQgZGlyZWN0bHkgZnJvbSBjYWNoZVxyXG4gICAgdmFyIHRoZUFjY291bnQ9bXNhbEhlbHBlci5mZXRjaEFjY291bnQoKTsgXHJcbiAgICBpZih0aGVBY2NvdW50IT1udWxsKSB0aGlzLmFmdGVyU2lnbmVkSW4odGhlQWNjb3VudCxcIm5vQW5pbWF0aW9uXCIpXHJcbn1cclxuXHJcbm1haW5VSS5wcm90b3R5cGUuYWZ0ZXJTaWduZWRJbj1mdW5jdGlvbihhbkFjY291bnQsbm9BbmltYXRpb24pe1xyXG4gICAgaWYobm9BbmltYXRpb24pe1xyXG4gICAgICAgICQoJyNoZWFkZXJQYXJ0JykuY3NzKHtoZWlnaHQ6XCIxMDB2aFwiLFwicGFkZGluZ1wiOlwiMTVweFwifSlcclxuICAgICAgICB0aGlzLnNob3dNb2R1bGVCdXR0b25zKClcclxuICAgIH1lbHNle1xyXG4gICAgICAgICQoJyNoZWFkZXJQYXJ0JykuYW5pbWF0ZSh7aGVpZ2h0OlwiMTAwdmhcIn0pXHJcbiAgICAgICAgJCgnI2dpdGh1YmxpbmsnKS5hbmltYXRlKHtvcGFjaXR5OlwiMFwifSlcclxuICAgICAgICAkKCcjc2lnbkluQnRuJykuYW5pbWF0ZSh7b3BhY2l0eTpcIjBcIn0pXHJcbiAgICAgICAgJCgnI2Zvb3RlclBhcnQnKS5hbmltYXRlKHtvcGFjaXR5OlwiMFwifSwoKT0+e3RoaXMuc2hvd01vZHVsZUJ1dHRvbnMoKX0pXHJcbiAgICAgICAgJCgnI2hlYWRlclBhcnQnKS5hbmltYXRlKHtcInBhZGRpbmdcIjpcIjE1cHhcIn0pXHJcbiAgICB9XHJcbn1cclxuXHJcbm1haW5VSS5wcm90b3R5cGUuc2hvd01vZHVsZUJ1dHRvbnM9ZnVuY3Rpb24oKXtcclxuICAgICQoJyNnaXRodWJsaW5rJykucmVtb3ZlKClcclxuICAgICQoJyNzaWduSW5CdG4nKS5yZW1vdmUoKVxyXG4gICAgJCgnI2Rlc2NyaXB0aW9uUGFydCcpLnJlbW92ZSgpXHJcbiAgICAkKCcjZm9vdGVyUGFydCcpLnJlbW92ZSgpXHJcblxyXG4gICAgLy8kKCcjaGVhZGVyUGFydCcpLmVtcHR5KClcclxuICAgIHZhciBkZXZpY2VNYW5hZ2VCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ob3Zlci1hbWJlciB3My1yaXBwbGUgdzMtY2FyZCB3My1wYWRkaW5nLTE2IHczLW1hcmdpbi1ib3R0b21cIiBzdHlsZT1cIndpZHRoOjU1MHB4O2Rpc3BsYXk6YmxvY2tcIj5EZXZpY2UgTWFuYWdlbWVudDwvYnV0dG9uPicpXHJcbiAgICB2YXIgYWR0VUlCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ob3Zlci1hbWJlciB3My1yaXBwbGUgdzMtY2FyZCB3My1wYWRkaW5nLTE2IHczLW1hcmdpbi1ib3R0b21cIiBzdHlsZT1cIndpZHRoOjU1MHB4O2Rpc3BsYXk6YmxvY2tcIj5EaWdpdGFsIFR3aW48L2J1dHRvbj4nKVxyXG4gICAgdmFyIGV2ZW50TG9nQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtaG92ZXItYW1iZXIgdzMtcmlwcGxlIHczLWNhcmQgdzMtcGFkZGluZy0xNiB3My1tYXJnaW4tYm90dG9tXCIgc3R5bGU9XCJ3aWR0aDo1NTBweDtkaXNwbGF5OmJsb2NrXCI+RXZlbnQgTG9nPC9idXR0b24+JylcclxuICAgIHZhciBsb2dvdXRCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ibGFjayB3My1yaXBwbGUgdzMtY2FyZCB3My1wYWRkaW5nLTE2IHczLW1hcmdpbi1ib3R0b21cIiBzdHlsZT1cIndpZHRoOjM1MHB4O2Rpc3BsYXk6YmxvY2s7bWFyZ2luLWxlZnQ6MTAwcHg7bWFyZ2luLXRvcDozMnB4XCI+U2lnbiBPdXQ8L2J1dHRvbj4nKVxyXG4gICAgXHJcbiAgICAkKCcjaGVhZGVyUGFydCcpLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwid2lkdGg6NTAlXCIgY2xhc3M9XCJ3My1jb250YWluZXIgIHczLWNlbGwgXCI+PC9kaXY+PGRpdiBpZD1cIm1pZGRsZURJVlwiIGNsYXNzPVwidzMtY29udGFpbmVyIHczLWNlbGwgdzMtY2VsbC1taWRkbGVcIiBzdHlsZT1cImhlaWdodDo1MHZoXCI+PC9kaXY+PGRpdiBzdHlsZT1cIndpZHRoOjUwJVwiIGNsYXNzPVwidzMtY29udGFpbmVyIHczLWNlbGxcIj4nKSlcclxuICAgICQoJyNtaWRkbGVESVYnKS5hcHBlbmQoZGV2aWNlTWFuYWdlQnRuLGFkdFVJQnRuLGV2ZW50TG9nQnRuLGxvZ291dEJ0bikgXHJcblxyXG4gICAgbG9nb3V0QnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIC8vVE9ETzogaWYgbG9nb3V0IGZyb20gdGhlIG1vZHVsZXMgcGFnZSwgc2hvdWxkIHJlZGlyZWN0IHRvIHRoZSBzcGFpbmRleC5odG1sIHBhZ2VcclxuICAgICAgICBjb25zdCBsb2dvdXRSZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICBwb3N0TG9nb3V0UmVkaXJlY3RVcmk6IGdsb2JhbEFwcFNldHRpbmdzLmxvZ291dFJlZGlyZWN0VXJpLFxyXG4gICAgICAgICAgICBtYWluV2luZG93UmVkaXJlY3RVcmk6IGdsb2JhbEFwcFNldHRpbmdzLmxvZ291dFJlZGlyZWN0VXJpXHJcbiAgICAgICAgfTtcclxuICAgIFxyXG4gICAgICAgIHRoaXMubXlNU0FMT2JqLmxvZ291dFBvcHVwKGxvZ291dFJlcXVlc3QpO1xyXG4gICAgfSlcclxuXHJcbiAgICBhZHRVSUJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB3aW5kb3cub3BlbihcImRpZ2l0YWx0d2lubW9kdWxlLmh0bWxcIiwgXCJfYmxhbmtcIik7XHJcbiAgICB9KVxyXG5cclxuICAgIC8vaWYgdGhpcyBwYWdlIGlzIG9wZW4gaW4gbG9jYWxob3N0IGVudmlyb25tZW50LCBhZGQgdGhyZWUgYnV0dG9ucyB0byBhbGxvdyBwYWdlcyBvcGVuaW5nIGFuZCB1c2luZyBsb2NhbCBydW5uaW5nIGFwaSBhcHAgaW5zdGVhZFxyXG4gICAgLy8gb2YgY2xvdWQgYXBpIGFwcCBpbiBhenVyZSBhcHAgc2VydmljZS4gSW4gcHJvZHVjdGlvbiBlbnZpcm9ubWVudCwgdGhlc2UgYnV0dG9ucyB3aWxsIG5ldmVyIHNob3dcclxuICAgIGlmKHdpbmRvdy5sb2NhdGlvbi5ocmVmLnN0YXJ0c1dpdGgoXCJodHRwOi8vbG9jYWxob3N0XCIpKXtcclxuICAgICAgICB2YXIgZGV2aWNlTWFuYWdlTG9jYWxBUElCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1kYXJrLWdyZXkgdzMtY2FyZCB3My1wYWRkaW5nLTE2IHczLW1hcmdpbi1ib3R0b21cIiA+RGV2aWNlIE1hbmFnZW1lbnQoTG9jYWwgQVBJKTwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGFkdFVJTG9jYWxBUElCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1kYXJrLWdyZXkgdzMtY2FyZCB3My1wYWRkaW5nLTE2IHczLW1hcmdpbi1ib3R0b21cIj5EaWdpdGFsIFR3aW4oTG9jYWwgQVBJKTwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGV2ZW50TG9nTG9jYWxBUElCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1kYXJrLWdyZXkgdzMtY2FyZCB3My1wYWRkaW5nLTE2IHczLW1hcmdpbi1ib3R0b21cIj5FdmVudCBMb2coTG9jYWwgQVBJKTwvYnV0dG9uPicpXHJcbiAgICAgICAgJCgnI21pZGRsZURJVicpLmFwcGVuZChkZXZpY2VNYW5hZ2VMb2NhbEFQSUJ0bixhZHRVSUxvY2FsQVBJQnRuLGV2ZW50TG9nTG9jYWxBUElCdG4pIFxyXG5cclxuICAgICAgICBhZHRVSUxvY2FsQVBJQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgICAgICB3aW5kb3cub3BlbihcImRpZ2l0YWx0d2lubW9kdWxlLmh0bWw/dGVzdD0xXCIsIFwiX2JsYW5rXCIpO1xyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbWFpblVJKCk7IiwiY29uc3QgZ2xvYmFsQXBwU2V0dGluZ3M9cmVxdWlyZShcIi4vZ2xvYmFsQXBwU2V0dGluZ3NcIilcclxuXHJcbmZ1bmN0aW9uIG1zYWxIZWxwZXIoKXtcclxuICAgIHRoaXMubXlNU0FMT2JqID0gbmV3IG1zYWwuUHVibGljQ2xpZW50QXBwbGljYXRpb24oZ2xvYmFsQXBwU2V0dGluZ3MubXNhbENvbmZpZyk7XHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLnNpZ25Jbj1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdHJ5e1xyXG4gICAgICAgIHZhciByZXNwb25zZT0gYXdhaXQgdGhpcy5teU1TQUxPYmoubG9naW5Qb3B1cCh7IHNjb3BlczogZ2xvYmFsQXBwU2V0dGluZ3MuYjJjU2NvcGVzIH0pXHJcbiAgICAgICAgaWYgKHJlc3BvbnNlICE9IG51bGwpe1xyXG4gICAgICAgICAgICB0aGlzLnNldEFjY291bnQocmVzcG9uc2UuYWNjb3VudClcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmFjY291bnRcclxuICAgICAgICB9IFxyXG4gICAgICAgIGVsc2UgIHJldHVybiB0aGlzLmZldGNoQWNjb3VudCgpXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgaWYoZS5lcnJvckNvZGUhPVwidXNlcl9jYW5jZWxsZWRcIikgY29uc29sZS5sb2coZSlcclxuICAgIH1cclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuc2V0QWNjb3VudD1mdW5jdGlvbih0aGVBY2NvdW50KXtcclxuICAgIGlmKHRoZUFjY291bnQ9PW51bGwpcmV0dXJuO1xyXG4gICAgdGhpcy5hY2NvdW50SWQgPSB0aGVBY2NvdW50LmhvbWVBY2NvdW50SWQ7XHJcbiAgICB0aGlzLnVzZXJuYW1lID0gdGhlQWNjb3VudC51c2VybmFtZTtcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuZmV0Y2hBY2NvdW50PWZ1bmN0aW9uKG5vQW5pbWF0aW9uKXtcclxuICAgIGNvbnN0IGN1cnJlbnRBY2NvdW50cyA9IHRoaXMubXlNU0FMT2JqLmdldEFsbEFjY291bnRzKCk7XHJcbiAgICBpZiAoY3VycmVudEFjY291bnRzLmxlbmd0aCA8IDEpIHJldHVybjtcclxuICAgIHZhciBmb3VuZEFjY291bnQ9bnVsbDtcclxuICAgIGZvcih2YXIgaT0wO2k8Y3VycmVudEFjY291bnRzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBhbkFjY291bnQ9IGN1cnJlbnRBY2NvdW50c1tpXVxyXG4gICAgICAgIGlmKGFuQWNjb3VudC5ob21lQWNjb3VudElkLnRvVXBwZXJDYXNlKCkuaW5jbHVkZXMoZ2xvYmFsQXBwU2V0dGluZ3MuYjJjU2lnblVwU2lnbkluTmFtZS50b1VwcGVyQ2FzZSgpKVxyXG4gICAgICAgICAgICAmJiBhbkFjY291bnQuaWRUb2tlbkNsYWltcy5pc3MudG9VcHBlckNhc2UoKS5pbmNsdWRlcyhnbG9iYWxBcHBTZXR0aW5ncy5tc2FsQ29uZmlnLmF1dGgua25vd25BdXRob3JpdGllc1swXS50b1VwcGVyQ2FzZSgpKVxyXG4gICAgICAgICAgICAmJiBhbkFjY291bnQuaWRUb2tlbkNsYWltcy5hdWQgPT09IGdsb2JhbEFwcFNldHRpbmdzLm1zYWxDb25maWcuYXV0aC5jbGllbnRJZFxyXG4gICAgICAgICl7XHJcbiAgICAgICAgICAgIGZvdW5kQWNjb3VudD0gYW5BY2NvdW50O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuc2V0QWNjb3VudChmb3VuZEFjY291bnQpXHJcbiAgICByZXR1cm4gZm91bmRBY2NvdW50O1xyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5jYWxsQVBJPWFzeW5jIGZ1bmN0aW9uKEFQSVN0cmluZyxSRVNUTWV0aG9kLHBheWxvYWQpe1xyXG4gICAgdmFyIGhlYWRlcnNPYmo9e31cclxuICAgIGlmKCFnbG9iYWxBcHBTZXR0aW5ncy5pc0xvY2FsVGVzdCl7XHJcbiAgICAgICAgdmFyIHRva2VuPWF3YWl0IHRoaXMuZ2V0VG9rZW4oKVxyXG4gICAgICAgIGhlYWRlcnNPYmpbXCJBdXRob3JpemF0aW9uXCJdPWBCZWFyZXIgJHt0b2tlbn1gXHJcbiAgICB9IFxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICB0eXBlOiBSRVNUTWV0aG9kIHx8ICdHRVQnLFxyXG4gICAgICAgICAgICBcImhlYWRlcnNcIjpoZWFkZXJzT2JqLFxyXG4gICAgICAgICAgICB1cmw6IGdsb2JhbEFwcFNldHRpbmdzLnRhc2tNYXN0ZXJBUElVUkkrQVBJU3RyaW5nLFxyXG4gICAgICAgICAgICBjcm9zc0RvbWFpbjogdHJ1ZSxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3BvbnNlRGF0YSwgdGV4dFN0YXR1cywganFYSFIpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUocmVzcG9uc2VEYXRhKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlRGF0YSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcclxuICAgICAgICAgICAgICAgIHJlamVjdChyZXNwb25zZURhdGEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pXHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLmdldFRva2VuPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgaWYodGhpcy5zdG9yZWRUb2tlbiE9bnVsbCl7XHJcbiAgICAgICAgICAgIHZhciBjdXJyVGltZT1wYXJzZUludChuZXcgRGF0ZSgpLmdldFRpbWUoKS8xMDAwKVxyXG4gICAgICAgICAgICBpZihjdXJyVGltZSs2MDAgPCB0aGlzLnN0b3JlZFRva2VuRXhwKSByZXR1cm4gdGhpcy5zdG9yZWRUb2tlblxyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdG9rZW5SZXF1ZXN0PXtcclxuICAgICAgICAgICAgc2NvcGVzOiBnbG9iYWxBcHBTZXR0aW5ncy5iMmNTY29wZXMsXHJcbiAgICAgICAgICAgIGZvcmNlUmVmcmVzaDogZmFsc2UsIC8vIFNldCB0aGlzIHRvIFwidHJ1ZVwiIHRvIHNraXAgYSBjYWNoZWQgdG9rZW4gYW5kIGdvIHRvIHRoZSBzZXJ2ZXIgdG8gZ2V0IGEgbmV3IHRva2VuXHJcbiAgICAgICAgICAgIGFjY291bnQ6IHRoaXMubXlNU0FMT2JqLmdldEFjY291bnRCeUhvbWVJZCh0aGlzLmFjY291bnRJZClcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICB2YXIgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLm15TVNBTE9iai5hY3F1aXJlVG9rZW5TaWxlbnQodG9rZW5SZXF1ZXN0KVxyXG4gICAgICAgIGlmICghcmVzcG9uc2UuYWNjZXNzVG9rZW4gfHwgcmVzcG9uc2UuYWNjZXNzVG9rZW4gPT09IFwiXCIpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IG1zYWwuSW50ZXJhY3Rpb25SZXF1aXJlZEF1dGhFcnJvcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc3RvcmVkVG9rZW49cmVzcG9uc2UuYWNjZXNzVG9rZW5cclxuICAgICAgICB0aGlzLnN0b3JlZFRva2VuRXhwPXJlc3BvbnNlLmlkVG9rZW5DbGFpbXMuZXhwXHJcbiAgICB9Y2F0Y2goZXJyb3Ipe1xyXG4gICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIG1zYWwuSW50ZXJhY3Rpb25SZXF1aXJlZEF1dGhFcnJvcikge1xyXG4gICAgICAgICAgICAvLyBmYWxsYmFjayB0byBpbnRlcmFjdGlvbiB3aGVuIHNpbGVudCBjYWxsIGZhaWxzXHJcbiAgICAgICAgICAgIHZhciByZXNwb25zZT1hd2FpdCB0aGlzLm15TVNBTE9iai5hY3F1aXJlVG9rZW5Qb3B1cCh0b2tlblJlcXVlc3QpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmFjY2Vzc1Rva2VuO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBtc2FsSGVscGVyKCk7Il19
