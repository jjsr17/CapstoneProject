import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";

import { ApolloProvider } from "@apollo/client/react";
import { client } from "./apolloClient";

const pca = new PublicClientApplication(msalConfig);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MsalProvider instance={pca}>
      <ApolloProvider client={client}>
        <App />
      </ApolloProvider>
    </MsalProvider>
  </React.StrictMode>
);
