"use strict";

function require(module) {
  if (module.startsWith('./') && require.scopes.hasOwnProperty(module.slice(2))) {
    return require.scopes[module.slice(2)];
  }
  else if (require.scopes.hasOwnProperty(module)) {
    return require.scopes[module];
  }
  throw new Error('module: ' + module + ' not found.');
}
require.scopes = {};
