"use strict";

[(function(exports) {

const {LruMap, log} = require('../utils');

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
      log('failed referer already');
      return false;
    }
    return true;
  }

  onHeadersReceived(details) {
    if (this.removeRefererFailedOnce(details)) {
      this.badRedirects.set(details.requestId);
      log(`failed referer removal, redirecting ${details.url}`);
      return details.response = {redirectUrl: details.url};
    }
  }
}

Object.assign(exports, {Referer});

})].map(func => typeof exports == 'undefined' ? define('/reasons/referer', func) : func(exports));
