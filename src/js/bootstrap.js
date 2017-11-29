"use strict";

function require(module) {
  if (module.startsWith('.')) {
    module = module.split('.').slice(-1)[0].split('/').slice(-1)[0];
  }

  if (require.scopes.hasOwnProperty(module)) {
    if (typeof require.scopes[module] === 'function') {
      require.scopes[module](require.scopes[module] = {});
    }
    return require.scopes[module];
  }
  throw new Error('module: ' + module + ' not found.');
}

require.scopes = {};
