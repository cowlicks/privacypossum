"use strict";

[(function(exports) {

const {memoize} = require('./utils'),
  {getBaseDomain} = require('./basedomain/basedomain'),
  {isMdfp} = require('./mdfp');

function isThirdParty(d1, d2) {
  let b1 = getBaseDomain(d1),
    b2 = getBaseDomain(d2);

  if (b1 == b2 || isMdfp(b1, b2)) {
    return false;
  }
  return true;
}
isThirdParty = memoize(isThirdParty, ([a, b]) => a + ' ' + b, 1000);

Object.assign(exports, {isThirdParty});

})].map(func => typeof exports == 'undefined' ? require.scopes.parties = func : func(exports));
