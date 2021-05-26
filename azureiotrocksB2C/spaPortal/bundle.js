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


    /*sign out code
    const logoutRequest = {
        postLogoutRedirectUri: this.msalConfig.auth.redirectUri,
        mainWindowRedirectUri: this.msalConfig.auth.redirectUri
    };

    this.myMSALObj.logoutPopup(logoutRequest);
    */

    //in case of page refresh and it might be ok to fetch account directly from cache
    this.fetchAccount(); 
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

mainUI.prototype.fetchAccount=function(){
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

    if(foundAccount) this.afterSignedIn(foundAccount)

}

mainUI.prototype.afterSignedIn=function(account){
    
    //TODO: switch to next step UI with functionality modules
    $('#headerPart').animate({height:"100vh"})
    $('#githublink').animate({opacity:"0"})
    $('#signInBtn').animate({opacity:"0"})
    $('#footerPart').animate({opacity:"0"},()=>{this.showModuleButtons()})
    $('#headerPart').animate({"padding":"15px"})
    
}

mainUI.prototype.showModuleButtons=function(){
    $('#githublink').remove()
    $('#signInBtn').remove()
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9zcGFTb3VyY2VDb2RlL21haW5VSS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8vdGhlIFN0YXJ0IHBhZ2UgaXMgdGhlIHNpZ24gaW4gcGFnZVxyXG5mdW5jdGlvbiBtYWluVUkoKSB7XHJcbiAgICB0aGlzLmIyY1BvbGljaWVzID0ge1xyXG4gICAgICAgIHNpZ25VcFNpZ25Jbk5hbWU6IFwiQjJDXzFfc2luZ3Vwc2lnbmluX3NwYWFwcDFcIixcclxuICAgICAgICBzaWduVXBTaWduSW5BdXRob3JpdHk6IFwiaHR0cHM6Ly9henVyZWlvdGIyYy5iMmNsb2dpbi5jb20vYXp1cmVpb3RiMmMub25taWNyb3NvZnQuY29tL0IyQ18xX3Npbmd1cHNpZ25pbl9zcGFhcHAxXCIsXHJcbiAgICAgICAgYXV0aG9yaXR5RG9tYWluOiBcImF6dXJlaW90YjJjLmIyY2xvZ2luLmNvbVwiXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHRoaXMubXNhbENvbmZpZyA9IHtcclxuICAgICAgICBhdXRoOiB7XHJcbiAgICAgICAgICAgIGNsaWVudElkOiBcImY0NjkzYmU1LTYwMWItNGQwZS05MjA4LWMzNWQ5YWQ2MjM4N1wiLFxyXG4gICAgICAgICAgICBhdXRob3JpdHk6IHRoaXMuYjJjUG9saWNpZXMuc2lnblVwU2lnbkluQXV0aG9yaXR5LFxyXG4gICAgICAgICAgICBrbm93bkF1dGhvcml0aWVzOiBbdGhpcy5iMmNQb2xpY2llcy5hdXRob3JpdHlEb21haW5dLFxyXG4gICAgICAgICAgICByZWRpcmVjdFVyaTogd2luZG93LmxvY2F0aW9uLmhyZWZcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNhY2hlOiB7XHJcbiAgICAgICAgICAgIGNhY2hlTG9jYXRpb246IFwic2Vzc2lvblN0b3JhZ2VcIiwgXHJcbiAgICAgICAgICAgIHN0b3JlQXV0aFN0YXRlSW5Db29raWU6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzeXN0ZW06IHtcclxuICAgICAgICAgICAgbG9nZ2VyT3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgbG9nZ2VyQ2FsbGJhY2s6IChsZXZlbCwgbWVzc2FnZSwgY29udGFpbnNQaWkpID0+IHt9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgdGhpcy5teU1TQUxPYmogPSBuZXcgbXNhbC5QdWJsaWNDbGllbnRBcHBsaWNhdGlvbih0aGlzLm1zYWxDb25maWcpO1xyXG4gICAgdGhpcy5hcGlDb25maWcgPSB7XHJcbiAgICAgICAgYjJjU2NvcGVzOiBbXCJodHRwczovL2F6dXJlaW90YjJjLm9ubWljcm9zb2Z0LmNvbS9hcGlmdW5jMS9iYXNpY1wiXSwvL1tcImh0dHBzOi8vYXp1cmVpb3RiMmMub25taWNyb3NvZnQuY29tL2FwaS9kZW1vLnJlYWRcIl1cclxuICAgICAgICB3ZWJBcGk6IFwiaHR0cHM6Ly9henVyZWlvdHJvY2tzYXBpZnVuY3Rpb24uYXp1cmV3ZWJzaXRlcy5uZXQvYXBpL0h0dHBUcmlnZ2VyMVwiXHJcbiAgICB9O1xyXG5cclxuICAgICQoJyNzaWduSW5CdG4nKS5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLnNpZ25JbigpfSlcclxuXHJcblxyXG4gICAgLypzaWduIG91dCBjb2RlXHJcbiAgICBjb25zdCBsb2dvdXRSZXF1ZXN0ID0ge1xyXG4gICAgICAgIHBvc3RMb2dvdXRSZWRpcmVjdFVyaTogdGhpcy5tc2FsQ29uZmlnLmF1dGgucmVkaXJlY3RVcmksXHJcbiAgICAgICAgbWFpbldpbmRvd1JlZGlyZWN0VXJpOiB0aGlzLm1zYWxDb25maWcuYXV0aC5yZWRpcmVjdFVyaVxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLm15TVNBTE9iai5sb2dvdXRQb3B1cChsb2dvdXRSZXF1ZXN0KTtcclxuICAgICovXHJcblxyXG4gICAgLy9pbiBjYXNlIG9mIHBhZ2UgcmVmcmVzaCBhbmQgaXQgbWlnaHQgYmUgb2sgdG8gZmV0Y2ggYWNjb3VudCBkaXJlY3RseSBmcm9tIGNhY2hlXHJcbiAgICB0aGlzLmZldGNoQWNjb3VudCgpOyBcclxufVxyXG5cclxubWFpblVJLnByb3RvdHlwZS5zaWduSW49YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgcmVzcG9uc2U9IGF3YWl0IHRoaXMubXlNU0FMT2JqLmxvZ2luUG9wdXAoeyBzY29wZXM6IFsuLi50aGlzLmFwaUNvbmZpZy5iMmNTY29wZXNdIH0pXHJcbiAgICAgICAgaWYgKHJlc3BvbnNlICE9IG51bGwpIHRoaXMuYWZ0ZXJTaWduZWRJbihyZXNwb25zZS5hY2NvdW50KTtcclxuICAgICAgICBlbHNlICB0aGlzLmZldGNoQWNjb3VudCgpXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgaWYoZS5lcnJvckNvZGUhPVwidXNlcl9jYW5jZWxsZWRcIikgY29uc29sZS5sb2coZSlcclxuICAgIH1cclxufVxyXG5cclxubWFpblVJLnByb3RvdHlwZS5mZXRjaEFjY291bnQ9ZnVuY3Rpb24oKXtcclxuICAgIGNvbnN0IGN1cnJlbnRBY2NvdW50cyA9IHRoaXMubXlNU0FMT2JqLmdldEFsbEFjY291bnRzKCk7XHJcbiAgICBpZiAoY3VycmVudEFjY291bnRzLmxlbmd0aCA8IDEpIHJldHVybjtcclxuICAgIHZhciBmb3VuZEFjY291bnQ9bnVsbDtcclxuICAgIGZvcih2YXIgaT0wO2k8Y3VycmVudEFjY291bnRzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBhbkFjY291bnQ9IGN1cnJlbnRBY2NvdW50c1tpXVxyXG4gICAgICAgIGlmKGFuQWNjb3VudC5ob21lQWNjb3VudElkLnRvVXBwZXJDYXNlKCkuaW5jbHVkZXModGhpcy5iMmNQb2xpY2llcy5zaWduVXBTaWduSW5OYW1lLnRvVXBwZXJDYXNlKCkpXHJcbiAgICAgICAgICAgICYmIGFuQWNjb3VudC5pZFRva2VuQ2xhaW1zLmlzcy50b1VwcGVyQ2FzZSgpLmluY2x1ZGVzKHRoaXMuYjJjUG9saWNpZXMuYXV0aG9yaXR5RG9tYWluLnRvVXBwZXJDYXNlKCkpXHJcbiAgICAgICAgICAgICYmIGFuQWNjb3VudC5pZFRva2VuQ2xhaW1zLmF1ZCA9PT0gdGhpcy5tc2FsQ29uZmlnLmF1dGguY2xpZW50SWRcclxuICAgICAgICApe1xyXG4gICAgICAgICAgICBmb3VuZEFjY291bnQ9IGFuQWNjb3VudDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYoZm91bmRBY2NvdW50KSB0aGlzLmFmdGVyU2lnbmVkSW4oZm91bmRBY2NvdW50KVxyXG5cclxufVxyXG5cclxubWFpblVJLnByb3RvdHlwZS5hZnRlclNpZ25lZEluPWZ1bmN0aW9uKGFjY291bnQpe1xyXG4gICAgXHJcbiAgICAvL1RPRE86IHN3aXRjaCB0byBuZXh0IHN0ZXAgVUkgd2l0aCBmdW5jdGlvbmFsaXR5IG1vZHVsZXNcclxuICAgICQoJyNoZWFkZXJQYXJ0JykuYW5pbWF0ZSh7aGVpZ2h0OlwiMTAwdmhcIn0pXHJcbiAgICAkKCcjZ2l0aHVibGluaycpLmFuaW1hdGUoe29wYWNpdHk6XCIwXCJ9KVxyXG4gICAgJCgnI3NpZ25JbkJ0bicpLmFuaW1hdGUoe29wYWNpdHk6XCIwXCJ9KVxyXG4gICAgJCgnI2Zvb3RlclBhcnQnKS5hbmltYXRlKHtvcGFjaXR5OlwiMFwifSwoKT0+e3RoaXMuc2hvd01vZHVsZUJ1dHRvbnMoKX0pXHJcbiAgICAkKCcjaGVhZGVyUGFydCcpLmFuaW1hdGUoe1wicGFkZGluZ1wiOlwiMTVweFwifSlcclxuICAgIFxyXG59XHJcblxyXG5tYWluVUkucHJvdG90eXBlLnNob3dNb2R1bGVCdXR0b25zPWZ1bmN0aW9uKCl7XHJcbiAgICAkKCcjZ2l0aHVibGluaycpLnJlbW92ZSgpXHJcbiAgICAkKCcjc2lnbkluQnRuJykucmVtb3ZlKClcclxuICAgICQoJyNmb290ZXJQYXJ0JykucmVtb3ZlKClcclxuXHJcbiAgICAvLyQoJyNoZWFkZXJQYXJ0JykuZW1wdHkoKVxyXG4gICAgdmFyIGRldmljZU1hbmFnZUJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyIHczLXJpcHBsZSB3My1jYXJkIHczLXBhZGRpbmctMTYgdzMtbWFyZ2luLWJvdHRvbVwiIHN0eWxlPVwid2lkdGg6NTUwcHg7ZGlzcGxheTpibG9ja1wiPkRldmljZSBNYW5hZ2VtZW50PC9idXR0b24+JylcclxuICAgIHZhciBhZHRVSUJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyIHczLXJpcHBsZSB3My1jYXJkIHczLXBhZGRpbmctMTYgdzMtbWFyZ2luLWJvdHRvbVwiIHN0eWxlPVwid2lkdGg6NTUwcHg7ZGlzcGxheTpibG9ja1wiPkRpZ2l0YWwgVHdpbjwvYnV0dG9uPicpXHJcbiAgICB2YXIgZXZlbnRMb2dCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ob3Zlci1hbWJlciB3My1yaXBwbGUgdzMtY2FyZCB3My1wYWRkaW5nLTE2IHczLW1hcmdpbi1ib3R0b21cIiBzdHlsZT1cIndpZHRoOjU1MHB4O2Rpc3BsYXk6YmxvY2tcIj5FdmVudCBMb2c8L2J1dHRvbj4nKVxyXG4gICAgdmFyIGxvZ291dEJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJsYWNrIHczLXJpcHBsZSB3My1jYXJkIHczLXBhZGRpbmctMTYgdzMtbWFyZ2luLWJvdHRvbVwiIHN0eWxlPVwid2lkdGg6MzUwcHg7ZGlzcGxheTpibG9jazttYXJnaW4tbGVmdDoxMDBweDttYXJnaW4tdG9wOjMycHhcIj5TaWduIE91dDwvYnV0dG9uPicpXHJcbiAgICBcclxuICAgICQoJyNoZWFkZXJQYXJ0JykuYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJ3aWR0aDo1MCVcIiBjbGFzcz1cInczLWNvbnRhaW5lciAgdzMtY2VsbCBcIj48L2Rpdj48ZGl2IGlkPVwibWlkZGxlRElWXCIgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtY2VsbCB3My1jZWxsLW1pZGRsZVwiIHN0eWxlPVwiaGVpZ2h0OjUwdmhcIj48L2Rpdj48ZGl2IHN0eWxlPVwid2lkdGg6NTAlXCIgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtY2VsbFwiPicpKVxyXG4gICAgJCgnI21pZGRsZURJVicpLmFwcGVuZChkZXZpY2VNYW5hZ2VCdG4sYWR0VUlCdG4sZXZlbnRMb2dCdG4sbG9nb3V0QnRuKSBcclxuXHJcbiAgICBsb2dvdXRCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgY29uc3QgbG9nb3V0UmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgcG9zdExvZ291dFJlZGlyZWN0VXJpOiB0aGlzLm1zYWxDb25maWcuYXV0aC5yZWRpcmVjdFVyaSxcclxuICAgICAgICAgICAgbWFpbldpbmRvd1JlZGlyZWN0VXJpOiB0aGlzLm1zYWxDb25maWcuYXV0aC5yZWRpcmVjdFVyaVxyXG4gICAgICAgIH07XHJcbiAgICBcclxuICAgICAgICB0aGlzLm15TVNBTE9iai5sb2dvdXRQb3B1cChsb2dvdXRSZXF1ZXN0KTtcclxuICAgIH0pXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1haW5VSSgpOyJdfQ==
