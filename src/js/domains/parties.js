"use strict";

[(function(exports) {

const {memoize} = require('../utils'),
  {URL} = require('../shim'),
  {getBaseDomain} = require('./basedomain'),
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

// takes `Tabs` instance and an annoted `details` object
function isRequestThirdParty(tabs, {tabId, initiator, urlObj: {hostname}}) {
  if (tabId === -1) {
    if (typeof initiator !== 'undefined') {
      let initiatorHostname = (new URL(initiator)).hostname;
      return isThirdParty(initiatorHostname, hostname);
    }
    return false; // no associated tab, so 3rd party isn't applicable
  }
  return tabs.isThirdParty(tabId, hostname);
}


Object.assign(exports, {isThirdParty, isRequestThirdParty});

})].map(func => typeof exports == 'undefined' ? define('/domains/parties', func) : func(exports));
