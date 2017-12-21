"use strict";

[(function(exports) {

const {mtemoize} = require('./utils'),
  {getBaseDomain} = require('./basedomain/basedomain'),
  {isMdfp} = require('./mdfp');

function isThirdParty(d1, d2) {
  let b1 = getBaseDomain(d1),
    b2 = getBaseDomain(d2);

  if (b1 != b2) {
    return isMdfp(b1, b2);
  }
  return true;
}
})].map(func => typeof exports == 'undefined' ? require.scopes.parties = func : func(exports));
