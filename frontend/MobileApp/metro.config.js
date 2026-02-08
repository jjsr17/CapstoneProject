// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import("expo/metro-config").MetroConfig} */
const config = getDefaultConfig(__dirname);

// Alias tslib to an ESM build so tslib.default is defined (fixes __extends crash)
const ALIASES = {
  tslib: "tslib/tslib.es6.mjs",
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const mapped = ALIASES[moduleName] ?? moduleName;
  return context.resolveRequest(context, mapped, platform);
};

module.exports = config;
