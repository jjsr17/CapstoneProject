export const msalConfig = {
  auth: {
    clientId: "b8a0b68a-5858-4d1c-a0c3-9d52db4696de",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["User.Read"],
};
