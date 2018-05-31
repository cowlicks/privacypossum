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

function is4xx(statusCode) {
  return (400 <= statusCode) && (statusCode < 500);
}

class Referer {
  constructor() {
    this.requestIdCache = new LruMap(1000);
    this.badRedirects = new LruMap(1000);
  }

  removeRefererFailedOnce({statusCode, requestId}) {
    return (is4xx(statusCode) && this.requestIdCache.has(requestId)) && !this.badRedirects.has(requestId);
  }

  failedAlready({requestId}) {
    return this.badRedirects.has(requestId);
  }

  shouldRemoveHeader(details, header) {
    if (!this.requestIdCache.has(details.requestId)) {
      this.requestIdCache.set(details.requestId, header.value);
    }

    if (this.failedAlready(details)) {
      return false;
    }

    return true;
  }

  onHeadersReceived(details) {
    if (this.removeRefererFailedOnce(details)) {
      this.badRedirects.set(details.requestId);
      return details.response = {redirectUrl: details.url};
    }
  }
}

Object.assign(exports, {Referer});

})].map(func => typeof exports == 'undefined' ? define('/reasons/referer', func) : func(exports));
