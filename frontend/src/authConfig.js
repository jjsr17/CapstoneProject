export const msalConfig = {
  auth: {
    clientId: "b8a0b68a-5858-4d1c-a0c3-9d52db4696de",
    authority: "https://login.microsoftonline.com/03f750b3-6ffc-46b7-8ea9-dd6d95a85164",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["api://67c503d9-933d-4652-a7df-9298c0c010f4/access_as_user"]
};

