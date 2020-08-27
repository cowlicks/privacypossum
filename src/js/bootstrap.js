/**
 * Simple commonjs-like module system that is compatible with node.
 *
 * We wrap each module in:
 *
 * [(function(exports) {
 * ...
 *
 * })].map(func => typeof exports == 'undefined' ? define('/path/to/module', func) : func(exports));
 *
 * Then in the module, exported objects are assigned to properties on `exports`.
 *
 * We use `require` to import modules relative to the current location, like so:
 *
 * const {someFunc} = require('./name');
 *
 * someFunc(...);
 *
 * Just like you would in node.
 *
 * We use this wrapping (instead of a IIAFE) because it lets us load the module lazily, or
 * immediately, based on the environment. It seemed to be the most concise
 * anonymous expression.
 *
 * New files need to be added to the manifest.json. And to appropriate html files, like popup.html.
 */

function require(module) {
  let before = require.loc;
  while (!module.startsWith('./')) {
    module = module.substr(1);
    require.loc = require.loc['..'];
  }

  let arr = module.substr(2).split('/');

  let part = arr.reduce(
    (obj, part) => {
      if (typeof obj[part] === 'function') {
        obj[part](obj[part] = {});
      }
      require.loc = obj[part];
      return obj[part];
    },
    require.loc
  );
  require.loc = before;
  return part;
}

// ('/path/to/module', func)
function define(name, moduleFunc) {  // eslint-disable-line
  let arr = name.substr(1).split('/'),
    lastName = arr.pop();

  let baseObj = arr.reduce(
    (obj, part) => obj.hasOwnProperty(part) ? obj[part] : obj[part] = {'..': obj},
    require.scopes
  );

  baseObj[lastName] = moduleFunc;
}
require.scopes = {};
require.loc = require.scopes;
