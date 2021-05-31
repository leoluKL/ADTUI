const b2cPolicies = {
    signUpSignInName: "B2C_1_singupsignin_spaapp1",
    signUpSignInAuthority: "https://azureiotb2c.b2clogin.com/azureiotb2c.onmicrosoft.com/B2C_1_singupsignin_spaapp1",
    editProfileAuthority: "https://azureiotb2c.b2clogin.com/azureiotb2c.onmicrosoft.com/B2C_1_editprofile_spaapp1",
    authorityDomain: "azureiotb2c.b2clogin.com"
}

const msalConfig = {
    auth: {
        clientId: "f4693be5-601b-4d0e-9208-c35d9ad62387", // This is the ONLY mandatory field; everything else is optional.
        authority: b2cPolicies.signUpSignInAuthority, // Choose sign-up/sign-in user-flow as your default.
        knownAuthorities: [b2cPolicies.authorityDomain], // You must identify your tenant's domain as a known authority.
        redirectUri: window.location.href
    },
    cache: {
        cacheLocation: "sessionStorage", // Configures cache location. "sessionStorage" is more secure, but "localStorage" gives you SSO between tabs.
        storeAuthStateInCookie: false, // If you wish to store cache items in cookies as well as browser cache, set this to "true".
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {}
        }
    }
};
const myMSALObj = new msal.PublicClientApplication(msalConfig);

let accountId = "";
let username = "";
selectAccount(); // in case of page refresh and it might be ok to fetch account directly from cache

const apiConfig = {
    b2cScopes: ["https://azureiotb2c.onmicrosoft.com/taskmastermodule/operation"]
};

function isTestUsingLocalAPIServer(){
    var strArr=window.location.href.split("?")
    var isTest=(strArr.indexOf("test=1")!=-1)
    return isTest
}

function getAPIURL(APIPart){
    if(isTestUsingLocalAPIServer()) return "http://localhost:5000/"+APIPart
    else return "https://azureiotrockstaskmastermodule.azurewebsites.net/"+APIPart
}

function welcomeUser() { //basically it hide buttons (singin) and show buttons: signout,editprofile,callapibutton
    document.getElementById('label').classList.add('d-none');
    document.getElementById('signIn').classList.add('d-none');

    document.getElementById('signOut').classList.remove('d-none');
    document.getElementById('editProfileButton').classList.remove('d-none');
    document.getElementById('callApiButton').classList.remove('d-none');
}

function setAccount(account) {
    accountId = account.homeAccountId;
    username = account.username;
    welcomeUser(username);
}

function selectAccount() { //basically it used a logged in account and hide those login buttons , or do nothing if not logged in yet
    //https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
    const currentAccounts = myMSALObj.getAllAccounts();

    if(isTestUsingLocalAPIServer())setAccount({})
    if (currentAccounts.length < 1) { //when not singed in yet, no account defined
        return;
    } else if (currentAccounts.length > 1) { //means there is a cached signed in account
        /**
         * Due to the way MSAL caches account objects, the auth response from initiating a user-flow
         * is cached as a new account, which results in more than one account in the cache. Here we make
         * sure we are selecting the account with homeAccountId that contains the sign-up/sign-in user-flow, 
         * as this is the default flow the user initially signed-in with.
         */
        const accounts = currentAccounts.filter(account =>
            account.homeAccountId.toUpperCase().includes(b2cPolicies.signUpSignInName.toUpperCase())
            &&
            account.idTokenClaims.iss.toUpperCase().includes(b2cPolicies.authorityDomain.toUpperCase())
            &&
            account.idTokenClaims.aud === msalConfig.auth.clientId
        );

        if (accounts.length > 1) {//means there is an account for this b2c application
            // localAccountId identifies the entity for which the token asserts information.
            if (accounts.every(account => account.localAccountId === accounts[0].localAccountId)) {
                // All accounts belong to the same user
                setAccount(accounts[0]);
            } else {
                // Multiple users detected. Logout all to be safe.
                signOut();
            };
        } else if (accounts.length === 1) {
            setAccount(accounts[0]);
        }

    } else if (currentAccounts.length === 1) {
        setAccount(currentAccounts[0]);
    }
}

function handleResponse(response) {
    /**
     * To see the full list of response object properties, visit:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md#response
     */
    console.log(response)


    if (response !== null) {
        setAccount(response.account);
    } else {
        selectAccount();
    }

}

function signIn() {
    /*
    * Scopes you add here will be prompted for user consent during sign-in.
    * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
    * For more information about OIDC scopes, visit: 
    * https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
    */
    console.log("sign in")
    myMSALObj.loginPopup({ scopes: [...apiConfig.b2cScopes] })//apiConfig.b2cScopes
        .then(handleResponse)
        .catch(error => {
            console.log(error);
        });
}

function signOut() {

    /**
     * You can pass a custom request object below. This will override the initial configuration. For more information, visit:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md#request
     */

    const logoutRequest = {
        postLogoutRedirectUri: msalConfig.auth.redirectUri,
        mainWindowRedirectUri: msalConfig.auth.redirectUri
    };

    myMSALObj.logoutPopup(logoutRequest);
}

function getTokenPopup(request) {

    /**
    * See here for more information on account retrieval: 
    * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
    */
    request.account = myMSALObj.getAccountByHomeId(accountId);


    /**
     * 
     */
    return myMSALObj.acquireTokenSilent(request)
        .then((response) => {
            // In case the response from B2C server has an empty accessToken field
            // throw an error to initiate token acquisition
            if (!response.accessToken || response.accessToken === "") {
                throw new msal.InteractionRequiredAuthError;
            }
            return response;
        })
        .catch(error => {
            console.log("Silent token acquisition fails. Acquiring token using popup. \n", error);
            if (error instanceof msal.InteractionRequiredAuthError) {
                // fallback to interaction when silent call fails
                return myMSALObj.acquireTokenPopup(request)
                    .then(response => {
                        console.log(response);
                        return response;
                    }).catch(error => {
                        console.log(error);
                    });
            } else {
                console.log(error);
            }
        });
}

function passTokenToApi() {
    /**
     * Scopes you add here will be used to request a token from Azure AD B2C to be used for accessing a protected resource.
     * To learn more about how to work with scopes and resources, see: 
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/resources-and-scopes.md
     */
    if(isTestUsingLocalAPIServer()){
        callApi()
    }
    else{
        console.log(apiConfig.b2cScopes)
        getTokenPopup({
            scopes: [...apiConfig.b2cScopes],  // e.g. ["https://fabrikamb2c.onmicrosoft.com/helloapi/demo.read"]
            forceRefresh: false // Set this to "true" to skip a cached token and go to the server to get a new token
        })
            .then(response => {
                if (response) {
                    console.log("access_token acquired at: " + new Date().toString());
                    try {
                        callApi(response.accessToken);
                    } catch (error) {
                        console.log(error);
                    }
                }
            });
    }

    
}

function callApi(token) {
    var headersObj={}
    if(!isTestUsingLocalAPIServer()) headersObj["Authorization"]=`Bearer ${token}`
    $.ajax({
        type: 'GET',
        "headers":headersObj,
        url: getAPIURL("tointernal"),
        crossDomain: true,
        success: function (responseData, textStatus, jqXHR) {
            $("#response").append($('<a style="display:block;font-size:10px">' + responseData + '</a>'))
        },
        error: function (responseData, textStatus, errorThrown) {
        }
    });
}

/**
 * To initiate a B2C user-flow, simply make a login request using
 * the full authority string of that user-flow e.g.
 * https://fabrikamb2c.b2clogin.com/fabrikamb2c.onmicrosoft.com/B2C_1_edit_profile_v2 
 */
function editProfile() {
    myMSALObj.loginPopup({
        authority: b2cPolicies.editProfileAuthority,
        loginHint: myMSALObj.getAccountByHomeId(accountId).username
    })
        .catch(error => {
            console.log(error);
        });
}
