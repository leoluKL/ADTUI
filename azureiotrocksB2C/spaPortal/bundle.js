(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
//the Start page is the sign in page
function mainUI() {
    this.b2cPolicies = {
        signUpSignInName: "B2C_1_singupsignin_spaapp1",
        signUpSignInAuthority: "https://azureiotb2c.b2clogin.com/azureiotb2c.onmicrosoft.com/B2C_1_singupsignin_spaapp1",
        authorityDomain: "azureiotb2c.b2clogin.com"
    }
    
    this.msalConfig = {
        auth: {
            clientId: "f4693be5-601b-4d0e-9208-c35d9ad62387",
            authority: this.b2cPolicies.signUpSignInAuthority,
            knownAuthorities: [this.b2cPolicies.authorityDomain],
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
    };
    this.myMSALObj = new msal.PublicClientApplication(this.msalConfig);
    this.apiConfig = {
        b2cScopes: ["https://azureiotb2c.onmicrosoft.com/apifunc1/basic"],//["https://azureiotb2c.onmicrosoft.com/api/demo.read"]
        webApi: "https://azureiotrocksapifunction.azurewebsites.net/api/HttpTrigger1"
    };

    $('#signInBtn').on("click",()=>{this.signIn()})

    //in case of page refresh and it might be ok to fetch account directly from cache
    this.fetchAccount("noAnimation"); 
}

mainUI.prototype.signIn=async function(){
    try{
        var response= await this.myMSALObj.loginPopup({ scopes: [...this.apiConfig.b2cScopes] })
        if (response != null) this.afterSignedIn(response.account);
        else  this.fetchAccount()
    }catch(e){
        if(e.errorCode!="user_cancelled") console.log(e)
    }
}

mainUI.prototype.fetchAccount=function(noAnimation){
    const currentAccounts = this.myMSALObj.getAllAccounts();
    if (currentAccounts.length < 1) return;
    var foundAccount=null;
    for(var i=0;i<currentAccounts.length;i++){
        var anAccount= currentAccounts[i]
        if(anAccount.homeAccountId.toUpperCase().includes(this.b2cPolicies.signUpSignInName.toUpperCase())
            && anAccount.idTokenClaims.iss.toUpperCase().includes(this.b2cPolicies.authorityDomain.toUpperCase())
            && anAccount.idTokenClaims.aud === this.msalConfig.auth.clientId
        ){
            foundAccount= anAccount;
        }
    }

    this.afterSignedIn(null,noAnimation)
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
        const logoutRequest = {
            postLogoutRedirectUri: this.msalConfig.auth.redirectUri,
            mainWindowRedirectUri: this.msalConfig.auth.redirectUri
        };
    
        this.myMSALObj.logoutPopup(logoutRequest);
    })
}

module.exports = new mainUI();
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9zcGFTb3VyY2VDb2RlL21haW5VSS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLy90aGUgU3RhcnQgcGFnZSBpcyB0aGUgc2lnbiBpbiBwYWdlXHJcbmZ1bmN0aW9uIG1haW5VSSgpIHtcclxuICAgIHRoaXMuYjJjUG9saWNpZXMgPSB7XHJcbiAgICAgICAgc2lnblVwU2lnbkluTmFtZTogXCJCMkNfMV9zaW5ndXBzaWduaW5fc3BhYXBwMVwiLFxyXG4gICAgICAgIHNpZ25VcFNpZ25JbkF1dGhvcml0eTogXCJodHRwczovL2F6dXJlaW90YjJjLmIyY2xvZ2luLmNvbS9henVyZWlvdGIyYy5vbm1pY3Jvc29mdC5jb20vQjJDXzFfc2luZ3Vwc2lnbmluX3NwYWFwcDFcIixcclxuICAgICAgICBhdXRob3JpdHlEb21haW46IFwiYXp1cmVpb3RiMmMuYjJjbG9naW4uY29tXCJcclxuICAgIH1cclxuICAgIFxyXG4gICAgdGhpcy5tc2FsQ29uZmlnID0ge1xyXG4gICAgICAgIGF1dGg6IHtcclxuICAgICAgICAgICAgY2xpZW50SWQ6IFwiZjQ2OTNiZTUtNjAxYi00ZDBlLTkyMDgtYzM1ZDlhZDYyMzg3XCIsXHJcbiAgICAgICAgICAgIGF1dGhvcml0eTogdGhpcy5iMmNQb2xpY2llcy5zaWduVXBTaWduSW5BdXRob3JpdHksXHJcbiAgICAgICAgICAgIGtub3duQXV0aG9yaXRpZXM6IFt0aGlzLmIyY1BvbGljaWVzLmF1dGhvcml0eURvbWFpbl0sXHJcbiAgICAgICAgICAgIHJlZGlyZWN0VXJpOiB3aW5kb3cubG9jYXRpb24uaHJlZlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY2FjaGU6IHtcclxuICAgICAgICAgICAgY2FjaGVMb2NhdGlvbjogXCJzZXNzaW9uU3RvcmFnZVwiLCBcclxuICAgICAgICAgICAgc3RvcmVBdXRoU3RhdGVJbkNvb2tpZTogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIHN5c3RlbToge1xyXG4gICAgICAgICAgICBsb2dnZXJPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBsb2dnZXJDYWxsYmFjazogKGxldmVsLCBtZXNzYWdlLCBjb250YWluc1BpaSkgPT4ge31cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICB0aGlzLm15TVNBTE9iaiA9IG5ldyBtc2FsLlB1YmxpY0NsaWVudEFwcGxpY2F0aW9uKHRoaXMubXNhbENvbmZpZyk7XHJcbiAgICB0aGlzLmFwaUNvbmZpZyA9IHtcclxuICAgICAgICBiMmNTY29wZXM6IFtcImh0dHBzOi8vYXp1cmVpb3RiMmMub25taWNyb3NvZnQuY29tL2FwaWZ1bmMxL2Jhc2ljXCJdLC8vW1wiaHR0cHM6Ly9henVyZWlvdGIyYy5vbm1pY3Jvc29mdC5jb20vYXBpL2RlbW8ucmVhZFwiXVxyXG4gICAgICAgIHdlYkFwaTogXCJodHRwczovL2F6dXJlaW90cm9ja3NhcGlmdW5jdGlvbi5henVyZXdlYnNpdGVzLm5ldC9hcGkvSHR0cFRyaWdnZXIxXCJcclxuICAgIH07XHJcblxyXG4gICAgJCgnI3NpZ25JbkJ0bicpLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuc2lnbkluKCl9KVxyXG5cclxuICAgIC8vaW4gY2FzZSBvZiBwYWdlIHJlZnJlc2ggYW5kIGl0IG1pZ2h0IGJlIG9rIHRvIGZldGNoIGFjY291bnQgZGlyZWN0bHkgZnJvbSBjYWNoZVxyXG4gICAgdGhpcy5mZXRjaEFjY291bnQoXCJub0FuaW1hdGlvblwiKTsgXHJcbn1cclxuXHJcbm1haW5VSS5wcm90b3R5cGUuc2lnbkluPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIHJlc3BvbnNlPSBhd2FpdCB0aGlzLm15TVNBTE9iai5sb2dpblBvcHVwKHsgc2NvcGVzOiBbLi4udGhpcy5hcGlDb25maWcuYjJjU2NvcGVzXSB9KVxyXG4gICAgICAgIGlmIChyZXNwb25zZSAhPSBudWxsKSB0aGlzLmFmdGVyU2lnbmVkSW4ocmVzcG9uc2UuYWNjb3VudCk7XHJcbiAgICAgICAgZWxzZSAgdGhpcy5mZXRjaEFjY291bnQoKVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGlmKGUuZXJyb3JDb2RlIT1cInVzZXJfY2FuY2VsbGVkXCIpIGNvbnNvbGUubG9nKGUpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1haW5VSS5wcm90b3R5cGUuZmV0Y2hBY2NvdW50PWZ1bmN0aW9uKG5vQW5pbWF0aW9uKXtcclxuICAgIGNvbnN0IGN1cnJlbnRBY2NvdW50cyA9IHRoaXMubXlNU0FMT2JqLmdldEFsbEFjY291bnRzKCk7XHJcbiAgICBpZiAoY3VycmVudEFjY291bnRzLmxlbmd0aCA8IDEpIHJldHVybjtcclxuICAgIHZhciBmb3VuZEFjY291bnQ9bnVsbDtcclxuICAgIGZvcih2YXIgaT0wO2k8Y3VycmVudEFjY291bnRzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBhbkFjY291bnQ9IGN1cnJlbnRBY2NvdW50c1tpXVxyXG4gICAgICAgIGlmKGFuQWNjb3VudC5ob21lQWNjb3VudElkLnRvVXBwZXJDYXNlKCkuaW5jbHVkZXModGhpcy5iMmNQb2xpY2llcy5zaWduVXBTaWduSW5OYW1lLnRvVXBwZXJDYXNlKCkpXHJcbiAgICAgICAgICAgICYmIGFuQWNjb3VudC5pZFRva2VuQ2xhaW1zLmlzcy50b1VwcGVyQ2FzZSgpLmluY2x1ZGVzKHRoaXMuYjJjUG9saWNpZXMuYXV0aG9yaXR5RG9tYWluLnRvVXBwZXJDYXNlKCkpXHJcbiAgICAgICAgICAgICYmIGFuQWNjb3VudC5pZFRva2VuQ2xhaW1zLmF1ZCA9PT0gdGhpcy5tc2FsQ29uZmlnLmF1dGguY2xpZW50SWRcclxuICAgICAgICApe1xyXG4gICAgICAgICAgICBmb3VuZEFjY291bnQ9IGFuQWNjb3VudDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5hZnRlclNpZ25lZEluKG51bGwsbm9BbmltYXRpb24pXHJcbn1cclxuXHJcbm1haW5VSS5wcm90b3R5cGUuYWZ0ZXJTaWduZWRJbj1mdW5jdGlvbihhbkFjY291bnQsbm9BbmltYXRpb24pe1xyXG4gICAgaWYobm9BbmltYXRpb24pe1xyXG4gICAgICAgICQoJyNoZWFkZXJQYXJ0JykuY3NzKHtoZWlnaHQ6XCIxMDB2aFwiLFwicGFkZGluZ1wiOlwiMTVweFwifSlcclxuICAgICAgICB0aGlzLnNob3dNb2R1bGVCdXR0b25zKClcclxuICAgIH1lbHNle1xyXG4gICAgICAgICQoJyNoZWFkZXJQYXJ0JykuYW5pbWF0ZSh7aGVpZ2h0OlwiMTAwdmhcIn0pXHJcbiAgICAgICAgJCgnI2dpdGh1YmxpbmsnKS5hbmltYXRlKHtvcGFjaXR5OlwiMFwifSlcclxuICAgICAgICAkKCcjc2lnbkluQnRuJykuYW5pbWF0ZSh7b3BhY2l0eTpcIjBcIn0pXHJcbiAgICAgICAgJCgnI2Zvb3RlclBhcnQnKS5hbmltYXRlKHtvcGFjaXR5OlwiMFwifSwoKT0+e3RoaXMuc2hvd01vZHVsZUJ1dHRvbnMoKX0pXHJcbiAgICAgICAgJCgnI2hlYWRlclBhcnQnKS5hbmltYXRlKHtcInBhZGRpbmdcIjpcIjE1cHhcIn0pXHJcbiAgICB9XHJcbn1cclxuXHJcbm1haW5VSS5wcm90b3R5cGUuc2hvd01vZHVsZUJ1dHRvbnM9ZnVuY3Rpb24oKXtcclxuICAgICQoJyNnaXRodWJsaW5rJykucmVtb3ZlKClcclxuICAgICQoJyNzaWduSW5CdG4nKS5yZW1vdmUoKVxyXG4gICAgJCgnI2Rlc2NyaXB0aW9uUGFydCcpLnJlbW92ZSgpXHJcbiAgICAkKCcjZm9vdGVyUGFydCcpLnJlbW92ZSgpXHJcblxyXG4gICAgLy8kKCcjaGVhZGVyUGFydCcpLmVtcHR5KClcclxuICAgIHZhciBkZXZpY2VNYW5hZ2VCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ob3Zlci1hbWJlciB3My1yaXBwbGUgdzMtY2FyZCB3My1wYWRkaW5nLTE2IHczLW1hcmdpbi1ib3R0b21cIiBzdHlsZT1cIndpZHRoOjU1MHB4O2Rpc3BsYXk6YmxvY2tcIj5EZXZpY2UgTWFuYWdlbWVudDwvYnV0dG9uPicpXHJcbiAgICB2YXIgYWR0VUlCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ob3Zlci1hbWJlciB3My1yaXBwbGUgdzMtY2FyZCB3My1wYWRkaW5nLTE2IHczLW1hcmdpbi1ib3R0b21cIiBzdHlsZT1cIndpZHRoOjU1MHB4O2Rpc3BsYXk6YmxvY2tcIj5EaWdpdGFsIFR3aW48L2J1dHRvbj4nKVxyXG4gICAgdmFyIGV2ZW50TG9nQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtaG92ZXItYW1iZXIgdzMtcmlwcGxlIHczLWNhcmQgdzMtcGFkZGluZy0xNiB3My1tYXJnaW4tYm90dG9tXCIgc3R5bGU9XCJ3aWR0aDo1NTBweDtkaXNwbGF5OmJsb2NrXCI+RXZlbnQgTG9nPC9idXR0b24+JylcclxuICAgIHZhciBsb2dvdXRCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ibGFjayB3My1yaXBwbGUgdzMtY2FyZCB3My1wYWRkaW5nLTE2IHczLW1hcmdpbi1ib3R0b21cIiBzdHlsZT1cIndpZHRoOjM1MHB4O2Rpc3BsYXk6YmxvY2s7bWFyZ2luLWxlZnQ6MTAwcHg7bWFyZ2luLXRvcDozMnB4XCI+U2lnbiBPdXQ8L2J1dHRvbj4nKVxyXG4gICAgXHJcbiAgICAkKCcjaGVhZGVyUGFydCcpLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwid2lkdGg6NTAlXCIgY2xhc3M9XCJ3My1jb250YWluZXIgIHczLWNlbGwgXCI+PC9kaXY+PGRpdiBpZD1cIm1pZGRsZURJVlwiIGNsYXNzPVwidzMtY29udGFpbmVyIHczLWNlbGwgdzMtY2VsbC1taWRkbGVcIiBzdHlsZT1cImhlaWdodDo1MHZoXCI+PC9kaXY+PGRpdiBzdHlsZT1cIndpZHRoOjUwJVwiIGNsYXNzPVwidzMtY29udGFpbmVyIHczLWNlbGxcIj4nKSlcclxuICAgICQoJyNtaWRkbGVESVYnKS5hcHBlbmQoZGV2aWNlTWFuYWdlQnRuLGFkdFVJQnRuLGV2ZW50TG9nQnRuLGxvZ291dEJ0bikgXHJcblxyXG4gICAgbG9nb3V0QnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGNvbnN0IGxvZ291dFJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHBvc3RMb2dvdXRSZWRpcmVjdFVyaTogdGhpcy5tc2FsQ29uZmlnLmF1dGgucmVkaXJlY3RVcmksXHJcbiAgICAgICAgICAgIG1haW5XaW5kb3dSZWRpcmVjdFVyaTogdGhpcy5tc2FsQ29uZmlnLmF1dGgucmVkaXJlY3RVcmlcclxuICAgICAgICB9O1xyXG4gICAgXHJcbiAgICAgICAgdGhpcy5teU1TQUxPYmoubG9nb3V0UG9wdXAobG9nb3V0UmVxdWVzdCk7XHJcbiAgICB9KVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBtYWluVUkoKTsiXX0=
