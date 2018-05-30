"use strict";

[(function(exports) {

const {LruMap} = require('../utils');

function markHeadersMutated(details) {
  details[details.headerPropName].mutated = true;
}

/* request thing:
 *
 *  remove referer, store requestId, & referer value
 *
 *  If this returns a 4xx, then redirect with the referer added back in.
 *  If this still fails, give up.
 */
function refererHeader({requestIdCache}, details, header) {
  header.value = details.url;
  markHeadersMutated(details);
  return false;
}

class Referer {
  constructor() {
    this.requestIdCache = new LruMap(1000);
    this.badRedirects = new Set();
  }

  removeRefererFailed({statusCode, requestId}) {
    return ((400 <= statusCode) && (statusCode < 500)) && this.requestId.has(requestId) && !this.badRedirects.has(requestId);
  }

  onBeforeSendHeaders(details, header) {
    if (this.failedAlready(details)) {
      return false;
    }
    return true;
  }

  onHeadersReceived(details) {
    if (this.removeRefererFailedOnce(details)) {
      this.badRedirects.add(details.requestId);
      return {redirectUrl: details.url}
    }
  }
  onBeforeRedirect(details) {
  }
}

Object.assign(exports, {Referer});

})].map(func => typeof exports == 'undefined' ? define('/reasons/referer', func) : func(exports));
