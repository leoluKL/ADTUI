const b2cPolicies = {
    signUpSignInName: "B2C_1_singupsignin_spaapp1",
    signUpSignInAuthority: "https://azureiotb2c.b2clogin.com/azureiotb2c.onmicrosoft.com/B2C_1_singupsignin_spaapp1",
    authorityDomain: "azureiotb2c.b2clogin.com"
}

const msalConfig = {
    auth: {
        clientId: "f4693be5-601b-4d0e-9208-c35d9ad62387",
        authority: b2cPolicies.signUpSignInAuthority,
        knownAuthorities: [b2cPolicies.authorityDomain],
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
const myMSALObj = new msal.PublicClientApplication(msalConfig);
const apiConfig = {
    b2cScopes: ["https://azureiotb2c.onmicrosoft.com/apifunc1/basic"],//["https://azureiotb2c.onmicrosoft.com/api/demo.read"]
    webApi: "https://azureiotrocksapifunction.azurewebsites.net/api/HttpTrigger1"
};


let accountId = "";
let username = "";
$('#signInBtn').on("click",signIn)
selectAccount(); // in case of page refresh and it might be ok to fetch account directly from cache


function setAccount(account) {
    accountId = account.homeAccountId;
    username = account.username;
    console.log(accountId,username)
    //TODO: move to the next module choosing page
}

function selectAccount() { 
    const currentAccounts = myMSALObj.getAllAccounts();

    if (currentAccounts.length < 1) return;//when not singed in yet, no account defined
    else if (currentAccounts.length > 1) { //means there is a cached signed in account
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


function signIn() {
    // By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
    myMSALObj.loginPopup({ scopes: [...apiConfig.b2cScopes] })
        .then((response)=>{
            if (response !== null) {
                setAccount(response.account);
            } else {
                selectAccount();
            }
        })
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
