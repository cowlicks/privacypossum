"use strict";

/**
 * Simple commonjs-like module system that is compatible with node.
 *
 * We wrap each module in:
 *
 * [(function(exports) {
 * ...
 *
 * })].map(func => typeof exports == 'undefined' ? require.scopes.name = func : func(exports));
 *
 * Then in the module, exported objects are assigned to properties on `exports`.
 *
 * We user `require` to import modules like so:
 *
 * const {someFunc} = require('./name');
 *
 * someFunc(...);
 *
 * Just like you would in node.
 *
 * We use this wrapping (instead of a IIAFE) because it lets us load the module lazily, or
 * immediately, based on the environment. It seemed to me the most concise
 * anonymous expression.
 */

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

// ('/path/to/module', func)
function define(name, moduleFunc) {
  // todo log here
  let arr = name.substr(1).split('/'),
    lastName = arr.pop();

  let baseObj = arr.reduce(
    (obj, part) => obj.hasOwnProperty(part) ? obj[part] : obj[part] = {'..': obj},
    require.scopes
  );

  baseObj[lastName] = moduleFunc;
}
require.scopes = {};
