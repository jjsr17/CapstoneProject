import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";

export const pca = new PublicClientApplication(msalConfig);

export const msalReady = (async () => {
  await pca.initialize();
  await pca.handleRedirectPromise();
  return pca;
})();
