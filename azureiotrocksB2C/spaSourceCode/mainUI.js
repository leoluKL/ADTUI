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