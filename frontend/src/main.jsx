import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";

import { ApolloProvider } from "@apollo/client/react";
import { client } from "./apolloClient";

const pca = new PublicClientApplication(msalConfig);

async function bootstrap() {
  // ✅ required in MSAL v3
  await pca.initialize();

  // ✅ process redirect response once
  await pca.handleRedirectPromise();

  ReactDOM.createRoot(document.getElementById("root")).render(
    <MsalProvider instance={pca}>
      <ApolloProvider client={client}>
        <App />
      </ApolloProvider>
    </MsalProvider>
  );
}

bootstrap().catch((e) => {
  console.error("MSAL bootstrap failed:", e);

  // still render app so you can see UI even if auth fails
  ReactDOM.createRoot(document.getElementById("root")).render(
    <MsalProvider instance={pca}>
      <ApolloProvider client={client}>
        <App />
      </ApolloProvider>
    </MsalProvider>
  );
});
